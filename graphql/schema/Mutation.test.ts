import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all dependencies
vi.mock("../../lib/sharing-service");
vi.mock("../../lib/input-validator");
vi.mock("../../lib/rate-limiter");
vi.mock("../../lib/submission-service");
vi.mock("../../lib/prisma", () => ({
  default: {
    birthdaySubmission: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    birthday: {
      findUnique: vi.fn(),
    },
  },
}));

import {
  BirthdaySubmissionInput,
  InputValidator,
} from "../../lib/input-validator";
import prisma from "../../lib/prisma";
import { RateLimitService } from "../../lib/rate-limiter";
import { SharingService } from "../../lib/sharing-service";
import { SubmissionService } from "../../lib/submission-service";
import { SubmissionStatus } from "@prisma/client";
import { Context } from "../context";

// Mock the mutation resolver logic
const mockSubmitBirthdayResolver = async (
  _: unknown,
  args: BirthdaySubmissionInput & { token: string },
  ctx: Context,
) => {
  const { SharingService } = await import("../../lib/sharing-service");
  const { InputValidator } = await import("../../lib/input-validator");
  const { RateLimitService } = await import("../../lib/rate-limiter");

  const clientIP = "127.0.0.1";

  // 1. Input validation and sanitization
  const validationResult = InputValidator.validateBirthdaySubmission(args);
  if (!validationResult.isValid) {
    throw new Error(`Validation failed: ${validationResult.errors.join(", ")}`);
  }

  const sanitizedData = validationResult.sanitizedData!;

  // 2. Rate limiting checks
  const ipRateLimit = await RateLimitService.checkSubmissionRateLimit(clientIP);
  if (!ipRateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded. Please try again in ${ipRateLimit.retryAfter} seconds.`,
    );
  }

  const linkRateLimit = await RateLimitService.checkLinkSubmissionRateLimit(
    sanitizedData.token,
  );
  if (!linkRateLimit.allowed) {
    throw new Error(
      `Too many submissions for this link. Please try again in ${linkRateLimit.retryAfter} seconds.`,
    );
  }

  // 3. Persistent rate limiting check
  const persistentCheck =
    await RateLimitService.checkPersistentRateLimit(clientIP);
  if (!persistentCheck.allowed) {
    throw new Error(persistentCheck.reason || "Request blocked");
  }

  // 4. Validate the sharing link
  const sharingLink = await SharingService.validateSharingLink(
    sanitizedData.token,
  );
  if (!sharingLink) {
    throw new Error("Invalid or expired sharing link");
  }

  // 5. Check for suspicious activity
  const suspiciousCheck = await RateLimitService.detectSuspiciousActivity(
    sanitizedData.token,
    {
      name: sanitizedData.name,
      date: sanitizedData.date,
      submitterEmail: sanitizedData.submitterEmail,
    },
  );

  if (suspiciousCheck.suspicious) {
    console.warn(`Suspicious activity detected: ${suspiciousCheck.reason}`);
  }

  // 6. Create the birthday submission with sanitized data
  return ctx.prisma.birthdaySubmission.create({
    data: {
      sharingLinkId: sharingLink.id,
      name: sanitizedData.name,
      date: sanitizedData.date,
      category: sanitizedData.category,
      notes: sanitizedData.notes,
      submitterName: sanitizedData.submitterName,
      submitterEmail: sanitizedData.submitterEmail,
      relationship: sanitizedData.relationship,
      status: SubmissionStatus.PENDING,
    },
  });
};

describe("submitBirthday GraphQL Mutation", () => {
  const mockContext = {
    prisma,
    user: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully submit birthday with valid data", async () => {
    const mockSharingLink = {
      id: "link-1",
      token: "valid-token",
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId: "user-1",
      createdAt: new Date(),
      description: null,
    };

    const mockSubmission = {
      id: "submission-1",
      sharingLinkId: "link-1",
      name: "John Doe",
      date: "1990-05-15",
      category: null,
      notes: null,
      submitterName: "Jane Doe",
      submitterEmail: "jane@example.com",
      relationship: "Friend",
      status: SubmissionStatus.PENDING,
      createdAt: new Date(),
    };

    // Mock all the service calls
    vi.mocked(InputValidator.validateBirthdaySubmission).mockReturnValue({
      isValid: true,
      errors: [],
      sanitizedData: {
        token: "valid-token",
        name: "John Doe",
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: "Jane Doe",
        submitterEmail: "jane@example.com",
        relationship: "Friend",
      },
    });

    vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: new Date(),
    });

    vi.mocked(RateLimitService.checkLinkSubmissionRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetTime: new Date(),
    });

    vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
      allowed: true,
    });

    vi.mocked(SharingService.validateSharingLink).mockResolvedValue(
      mockSharingLink,
    );

    vi.mocked(RateLimitService.detectSuspiciousActivity).mockResolvedValue({
      suspicious: false,
    });

    vi.mocked(prisma.birthdaySubmission.create).mockResolvedValue(
      mockSubmission,
    );

    const args = {
      token: "valid-token",
      name: "John Doe",
      date: "1990-05-15",
      submitterName: "Jane Doe",
      submitterEmail: "jane@example.com",
      relationship: "Friend",
    };

    const result = await mockSubmitBirthdayResolver(null, args, mockContext);

    expect(result).toEqual(mockSubmission);
    expect(InputValidator.validateBirthdaySubmission).toHaveBeenCalledWith(
      args,
    );
    expect(SharingService.validateSharingLink).toHaveBeenCalledWith(
      "valid-token",
    );
    expect(prisma.birthdaySubmission.create).toHaveBeenCalledWith({
      data: {
        sharingLinkId: "link-1",
        name: "John Doe",
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: "Jane Doe",
        submitterEmail: "jane@example.com",
        relationship: "Friend",
        status: SubmissionStatus.PENDING,
      },
    });
  });

  it("should reject submission with invalid data", async () => {
    vi.mocked(InputValidator.validateBirthdaySubmission).mockReturnValue({
      isValid: false,
      errors: ["Name is required", "Invalid date format"],
    });

    const args = {
      token: "valid-token",
      name: "",
      date: "invalid-date",
    };

    await expect(
      mockSubmitBirthdayResolver(null, args, mockContext),
    ).rejects.toThrow(
      "Validation failed: Name is required, Invalid date format",
    );
  });

  it("should reject submission when rate limited", async () => {
    vi.mocked(InputValidator.validateBirthdaySubmission).mockReturnValue({
      isValid: true,
      errors: [],
      sanitizedData: {
        token: "valid-token",
        name: "John Doe",
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
      },
    });

    vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: new Date(),
      retryAfter: 3600,
    });

    const args = {
      token: "valid-token",
      name: "John Doe",
      date: "1990-05-15",
    };

    await expect(
      mockSubmitBirthdayResolver(null, args, mockContext),
    ).rejects.toThrow("Rate limit exceeded. Please try again in 3600 seconds.");
  });

  it("should reject submission with invalid sharing link", async () => {
    vi.mocked(InputValidator.validateBirthdaySubmission).mockReturnValue({
      isValid: true,
      errors: [],
      sanitizedData: {
        token: "invalid-token",
        name: "John Doe",
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
      },
    });

    vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: new Date(),
    });

    vi.mocked(RateLimitService.checkLinkSubmissionRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetTime: new Date(),
    });

    vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
      allowed: true,
    });

    vi.mocked(SharingService.validateSharingLink).mockResolvedValue(null);

    const args = {
      token: "invalid-token",
      name: "John Doe",
      date: "1990-05-15",
    };

    await expect(
      mockSubmitBirthdayResolver(null, args, mockContext),
    ).rejects.toThrow("Invalid or expired sharing link");
  });

  it("should handle database errors gracefully", async () => {
    const mockSharingLink = {
      id: "link-1",
      token: "valid-token",
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId: "user-1",
      createdAt: new Date(),
      description: null,
    };

    vi.mocked(InputValidator.validateBirthdaySubmission).mockReturnValue({
      isValid: true,
      errors: [],
      sanitizedData: {
        token: "valid-token",
        name: "John Doe",
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
      },
    });

    vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: new Date(),
    });

    vi.mocked(RateLimitService.checkLinkSubmissionRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetTime: new Date(),
    });

    vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
      allowed: true,
    });

    vi.mocked(SharingService.validateSharingLink).mockResolvedValue(
      mockSharingLink,
    );

    vi.mocked(RateLimitService.detectSuspiciousActivity).mockResolvedValue({
      suspicious: false,
    });

    vi.mocked(prisma.birthdaySubmission.create).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const args = {
      token: "valid-token",
      name: "John Doe",
      date: "1990-05-15",
    };

    await expect(
      mockSubmitBirthdayResolver(null, args, mockContext),
    ).rejects.toThrow("Database connection failed");
  });
});

describe("Submission Management GraphQL Operations", () => {
  const mockContext = {
    prisma,
    user: { id: "user-1" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPendingSubmissions Query", () => {
    const mockGetPendingSubmissionsResolver = async (
      _: unknown,
      args: { page: number; limit: number },
      ctx: Context,
    ) => {
      const { page = 1, limit = 10 } = args;
      const skip = (page - 1) * limit;

      const [submissions, totalCount] = await Promise.all([
        ctx.prisma.birthdaySubmission.findMany({
          where: {
            sharingLink: {
              userId: ctx.user?.id as string,
            },
            status: SubmissionStatus.PENDING,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            sharingLink: {
              select: {
                description: true,
                createdAt: true,
              },
            },
          },
        }),
        ctx.prisma.birthdaySubmission.count({
          where: {
            sharingLink: {
              userId: ctx.user?.id as string,
            },
            status: SubmissionStatus.PENDING,
          },
        }),
      ]);

      return {
        submissions,
        totalCount,
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    };

    it("should return paginated pending submissions", async () => {
      const mockSubmissions = [
        {
          id: "sub-1",
          name: "John Doe",
          date: "1990-05-15",
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: { description: "Family", createdAt: new Date() },
          sharingLinkId: "link-1",
          category: null,
          notes: null,
          submitterName: null,
          submitterEmail: null,
          relationship: null,
        },
        {
          id: "sub-2",
          name: "Jane Smith",
          date: "1985-12-20",
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: { description: "Friends", createdAt: new Date() },
          sharingLinkId: "link-1",
          category: null,
          notes: null,
          submitterName: null,
          submitterEmail: null,
          relationship: null,
        },
      ];

      vi.mocked(prisma.birthdaySubmission.findMany).mockResolvedValue(
        mockSubmissions,
      );
      vi.mocked(prisma.birthdaySubmission.count).mockResolvedValue(15);

      const result = await mockGetPendingSubmissionsResolver(
        null,
        { page: 1, limit: 10 },
        mockContext,
      );

      expect(result).toEqual({
        submissions: mockSubmissions,
        totalCount: 15,
        hasNextPage: true,
        hasPreviousPage: false,
        currentPage: 1,
        totalPages: 2,
      });

      expect(prisma.birthdaySubmission.findMany).toHaveBeenCalledWith({
        where: {
          sharingLink: { userId: "user-1" },
          status: SubmissionStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
        include: {
          sharingLink: {
            select: {
              description: true,
              createdAt: true,
            },
          },
        },
      });
    });

    it("should handle pagination correctly for second page", async () => {
      vi.mocked(prisma.birthdaySubmission.findMany).mockResolvedValue([]);
      vi.mocked(prisma.birthdaySubmission.count).mockResolvedValue(15);

      const result = await mockGetPendingSubmissionsResolver(
        null,
        { page: 2, limit: 10 },
        mockContext,
      );

      expect(result.currentPage).toBe(2);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
      expect(prisma.birthdaySubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe("importSubmission Mutation", () => {
    const mockImportSubmissionResolver = async (
      _: unknown,
      args: { submissionId: string },
      ctx: Context,
    ) => {
      const { SubmissionService } = await import(
        "../../lib/submission-service"
      );

      const result = await SubmissionService.importSubmission(
        args.submissionId,
        ctx.user?.id as string,
      );

      if (!result.success) {
        throw new Error(
          result.errors?.join(", ") || "Failed to import submission",
        );
      }

      return ctx.prisma.birthday.findUnique({
        where: { id: result.birthdayId },
      });
    };

    it("should successfully import a submission", async () => {
      const mockBirthday = {
        id: "birthday-1",
        name: "John Doe",
        date: "1990-05-15",
        userId: "user-1",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
        createdAt: new Date(),
        parent: null,
        importSource: null,
      };

      vi.mocked(SubmissionService.importSubmission).mockResolvedValue({
        success: true,
        birthdayId: "birthday-1",
      });

      vi.mocked(prisma.birthday.findUnique).mockResolvedValue(mockBirthday);

      const result = await mockImportSubmissionResolver(
        null,
        { submissionId: "sub-1" },
        mockContext,
      );

      expect(result).toEqual(mockBirthday);
      expect(SubmissionService.importSubmission).toHaveBeenCalledWith(
        "sub-1",
        "user-1",
      );
    });

    it("should throw error when import fails", async () => {
      vi.mocked(SubmissionService.importSubmission).mockResolvedValue({
        success: false,
        errors: ["Submission not found"],
      });

      await expect(
        mockImportSubmissionResolver(
          null,
          { submissionId: "invalid-sub" },
          mockContext,
        ),
      ).rejects.toThrow("Submission not found");
    });
  });

  describe("rejectSubmission Mutation", () => {
    const mockRejectSubmissionResolver = async (
      _: unknown,
      args: { submissionId: string },
      ctx: Context,
    ) => {
      const { SubmissionService } = await import(
        "../../lib/submission-service"
      );

      const result = await SubmissionService.rejectSubmission(
        args.submissionId,
        ctx.user?.id as string,
      );

      if (!result.success) {
        throw new Error(
          result.errors?.join(", ") || "Failed to reject submission",
        );
      }

      return ctx.prisma.birthdaySubmission.findUnique({
        where: { id: args.submissionId },
      });
    };

    it("should successfully reject a submission", async () => {
      const mockSubmission = {
        id: "sub-1",
        name: "John Doe",
        status: SubmissionStatus.REJECTED,
        sharingLinkId: "link-1",
        category: null,
        date: "1990-05-15",
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
        createdAt: new Date(),
        parent: null,
        importSource: null,
      };

      vi.mocked(SubmissionService.rejectSubmission).mockResolvedValue({
        success: true,
      });

      vi.mocked(prisma.birthdaySubmission.findUnique).mockResolvedValue(
        mockSubmission,
      );

      const result = await mockRejectSubmissionResolver(
        null,
        { submissionId: "sub-1" },
        mockContext,
      );

      expect(result).toEqual(mockSubmission);
      expect(SubmissionService.rejectSubmission).toHaveBeenCalledWith(
        "sub-1",
        "user-1",
      );
    });

    it("should throw error when rejection fails", async () => {
      vi.mocked(SubmissionService.rejectSubmission).mockResolvedValue({
        success: false,
        errors: ["Submission already processed"],
      });

      await expect(
        mockRejectSubmissionResolver(
          null,
          { submissionId: "processed-sub" },
          mockContext,
        ),
      ).rejects.toThrow("Submission already processed");
    });
  });

  describe("bulkImportSubmissions Mutation", () => {
    const mockBulkImportResolver = async (
      _: unknown,
      args: { submissionIds: string[] },
      ctx: Context,
    ) => {
      const { SubmissionService } = await import(
        "../../lib/submission-service"
      );

      const result = await SubmissionService.bulkImportSubmissions(
        args.submissionIds,
        ctx.user?.id as string,
      );

      return {
        success: result.success,
        processedCount: result.imported,
        failedCount: result.failed.length,
        failedIds: result.failed,
        errors: result.errors || [],
      };
    };

    it("should successfully import multiple submissions", async () => {
      vi.mocked(SubmissionService.bulkImportSubmissions).mockResolvedValue({
        success: true,
        imported: 3,
        failed: [],
        errors: [],
      });

      const result = await mockBulkImportResolver(
        null,
        { submissionIds: ["sub-1", "sub-2", "sub-3"] },
        mockContext,
      );

      expect(result).toEqual({
        success: true,
        processedCount: 3,
        failedCount: 0,
        failedIds: [],
        errors: [],
      });
    });

    it("should handle partial failures in bulk import", async () => {
      vi.mocked(SubmissionService.bulkImportSubmissions).mockResolvedValue({
        success: false,
        imported: 2,
        failed: ["sub-3"],
        errors: ["Submission sub-3 not found"],
      });

      const result = await mockBulkImportResolver(
        null,
        { submissionIds: ["sub-1", "sub-2", "sub-3"] },
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        processedCount: 2,
        failedCount: 1,
        failedIds: ["sub-3"],
        errors: ["Submission sub-3 not found"],
      });
    });
  });

  describe("bulkRejectSubmissions Mutation", () => {
    const mockBulkRejectResolver = async (
      _: unknown,
      args: { submissionIds: string[] },
      ctx: Context,
    ) => {
      const { SubmissionService } = await import(
        "../../lib/submission-service"
      );

      const result = await SubmissionService.bulkRejectSubmissions(
        args.submissionIds,
        ctx.user?.id as string,
      );

      return {
        success: result.success,
        processedCount: result.rejected,
        failedCount: result.failed.length,
        failedIds: result.failed,
        errors: result.errors || [],
      };
    };

    it("should successfully reject multiple submissions", async () => {
      vi.mocked(SubmissionService.bulkRejectSubmissions).mockResolvedValue({
        success: true,
        rejected: 2,
        failed: [],
        errors: [],
      });

      const result = await mockBulkRejectResolver(
        null,
        { submissionIds: ["sub-1", "sub-2"] },
        mockContext,
      );

      expect(result).toEqual({
        success: true,
        processedCount: 2,
        failedCount: 0,
        failedIds: [],
        errors: [],
      });
    });

    it("should handle partial failures in bulk reject", async () => {
      vi.mocked(SubmissionService.bulkRejectSubmissions).mockResolvedValue({
        success: false,
        rejected: 1,
        failed: ["sub-2"],
        errors: ["Submission sub-2 already processed"],
      });

      const result = await mockBulkRejectResolver(
        null,
        { submissionIds: ["sub-1", "sub-2"] },
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        processedCount: 1,
        failedCount: 1,
        failedIds: ["sub-2"],
        errors: ["Submission sub-2 already processed"],
      });
    });
  });

  describe("getSubmissionDuplicates Mutation", () => {
    const mockGetDuplicatesResolver = async (
      _: unknown,
      args: { submissionId: string },
      ctx: Context,
    ) => {
      const { SubmissionService } = await import(
        "../../lib/submission-service"
      );

      const submission = await ctx.prisma.birthdaySubmission.findFirst({
        where: {
          id: args.submissionId,
          sharingLink: {
            userId: ctx.user?.id as string,
          },
        },
      });

      if (!submission) {
        throw new Error("Submission not found");
      }

      const result = await SubmissionService.detectDuplicates(
        ctx.user?.id as string,
        {
          name: submission.name,
          date: submission.date,
          category: submission.category || undefined,
          notes: submission.notes || undefined,
          submitterName: submission.submitterName || undefined,
          submitterEmail: submission.submitterEmail || undefined,
          relationship: submission.relationship || undefined,
        },
      );

      return result;
    };

    it("should detect duplicates for a submission", async () => {
      const mockSubmission = {
        id: "sub-1",
        name: "John Doe",
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
        sharingLinkId: "link-1",
        status: SubmissionStatus.PENDING,
        createdAt: new Date(),
      };

      const mockDuplicateResult = {
        hasDuplicates: true,
        matches: [
          {
            id: "birthday-1",
            name: "John Doe",
            date: "1990-05-15",
            category: "Family",
            similarity: 0.95,
          },
        ],
      };

      vi.mocked(prisma.birthdaySubmission.findFirst).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(SubmissionService.detectDuplicates).mockResolvedValue(
        mockDuplicateResult,
      );

      const result = await mockGetDuplicatesResolver(
        null,
        { submissionId: "sub-1" },
        mockContext,
      );

      expect(result).toEqual(mockDuplicateResult);
      expect(SubmissionService.detectDuplicates).toHaveBeenCalledWith(
        "user-1",
        {
          name: "John Doe",
          date: "1990-05-15",
          category: undefined,
          notes: undefined,
          submitterName: undefined,
          submitterEmail: undefined,
          relationship: undefined,
        },
      );
    });

    it("should throw error when submission not found", async () => {
      vi.mocked(prisma.birthdaySubmission.findFirst).mockResolvedValue(null);

      await expect(
        mockGetDuplicatesResolver(
          null,
          { submissionId: "invalid-sub" },
          mockContext,
        ),
      ).rejects.toThrow("Submission not found");
    });

    it("should return no duplicates when none found", async () => {
      const mockSubmission = {
        id: "sub-1",
        name: "Unique Person",
        date: "2000-01-01",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
        sharingLinkId: "link-1",
        status: SubmissionStatus.PENDING,
        createdAt: new Date(),
        importSource: null,
        parent: null,
      };

      const mockDuplicateResult = {
        hasDuplicates: false,
        matches: [],
      };

      vi.mocked(prisma.birthdaySubmission.findFirst).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(SubmissionService.detectDuplicates).mockResolvedValue(
        mockDuplicateResult,
      );

      const result = await mockGetDuplicatesResolver(
        null,
        { submissionId: "sub-1" },
        mockContext,
      );

      expect(result).toEqual(mockDuplicateResult);
    });
  });
});
