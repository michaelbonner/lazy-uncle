import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubmissionService } from "./submission-service";
import { SharingService } from "./sharing-service";
import { InputValidator } from "./input-validator";
import { SubmissionStatus } from "@prisma/client";

// Mock dependencies
vi.mock("./prisma", () => ({
  default: {
    birthdaySubmission: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    birthday: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./sharing-service");
vi.mock("./input-validator");

const mockPrisma = vi.mocked(await import("./prisma")).default;
const mockSharingService = vi.mocked(SharingService);
const mockInputValidator = vi.mocked(InputValidator);

describe("SubmissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processSubmission", () => {
    const validSubmissionData = {
      name: "John Doe",
      date: "1990-05-15",
      category: "Friend",
      notes: "Great friend",
      submitterName: "Jane Smith",
      submitterEmail: "jane@example.com",
      relationship: "Friend",
    };

    const mockSharingLink = {
      id: "link-123",
      token: "valid-token",
      userId: "user-123",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      isActive: true,
      description: "Test link",
    };

    it("should successfully process a valid submission", async () => {
      // Mock sharing link validation
      mockSharingService.validateSharingLink.mockResolvedValue(mockSharingLink);

      // Mock input validation
      mockInputValidator.validateBirthdaySubmission.mockReturnValue({
        isValid: true,
        errors: [],
        sanitizedData: {
          ...validSubmissionData,
          token: "valid-token",
        },
      });

      // Mock rate limit check
      mockPrisma.birthdaySubmission.count.mockResolvedValue(0);

      // Mock submission creation
      const mockSubmission = {
        id: "submission-123",
        sharingLinkId: "link-123",
        ...validSubmissionData,
        status: SubmissionStatus.PENDING,
        createdAt: new Date(),
      };
      mockPrisma.birthdaySubmission.create.mockResolvedValue(mockSubmission);

      const result = await SubmissionService.processSubmission(
        "valid-token",
        validSubmissionData,
      );

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe("submission-123");
      expect(result.errors).toBeUndefined();

      expect(mockSharingService.validateSharingLink).toHaveBeenCalledWith(
        "valid-token",
      );
      expect(
        mockInputValidator.validateBirthdaySubmission,
      ).toHaveBeenCalledWith({
        ...validSubmissionData,
        token: "valid-token",
      });
      expect(mockPrisma.birthdaySubmission.create).toHaveBeenCalledWith({
        data: {
          sharingLinkId: "link-123",
          name: validSubmissionData.name,
          date: validSubmissionData.date,
          category: validSubmissionData.category,
          notes: validSubmissionData.notes,
          submitterName: validSubmissionData.submitterName,
          submitterEmail: validSubmissionData.submitterEmail,
          relationship: validSubmissionData.relationship,
          status: SubmissionStatus.PENDING,
        },
      });
    });

    it("should reject submission with invalid sharing link", async () => {
      mockSharingService.validateSharingLink.mockResolvedValue(null);

      const result = await SubmissionService.processSubmission(
        "invalid-token",
        validSubmissionData,
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(["Invalid or expired sharing link"]);
      expect(result.submissionId).toBeUndefined();
    });

    it("should reject submission with invalid input data", async () => {
      mockSharingService.validateSharingLink.mockResolvedValue(mockSharingLink);

      mockInputValidator.validateBirthdaySubmission.mockReturnValue({
        isValid: false,
        errors: ["Name is required", "Invalid date format"],
      });

      const result = await SubmissionService.processSubmission("valid-token", {
        name: "",
        date: "invalid-date",
      });

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Name is required",
        "Invalid date format",
      ]);
    });

    it("should reject submission when rate limit exceeded", async () => {
      mockSharingService.validateSharingLink.mockResolvedValue(mockSharingLink);

      mockInputValidator.validateBirthdaySubmission.mockReturnValue({
        isValid: true,
        errors: [],
        sanitizedData: {
          ...validSubmissionData,
          token: "valid-token",
        },
      });

      // Mock rate limit exceeded
      mockPrisma.birthdaySubmission.count.mockResolvedValue(15);

      const result = await SubmissionService.processSubmission(
        "valid-token",
        validSubmissionData,
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Too many submissions in the last hour. Please try again later.",
      ]);
    });

    it("should handle database errors gracefully", async () => {
      mockSharingService.validateSharingLink.mockResolvedValue(mockSharingLink);

      mockInputValidator.validateBirthdaySubmission.mockReturnValue({
        isValid: true,
        errors: [],
        sanitizedData: {
          ...validSubmissionData,
          token: "valid-token",
        },
      });

      mockPrisma.birthdaySubmission.count.mockResolvedValue(0);
      mockPrisma.birthdaySubmission.create.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await SubmissionService.processSubmission(
        "valid-token",
        validSubmissionData,
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Failed to process submission. Please try again.",
      ]);
    });
  });

  describe("detectDuplicates", () => {
    const submissionData = {
      name: "John Doe",
      date: "1990-05-15",
      category: "Friend",
    };

    it("should detect exact duplicate", async () => {
      const existingBirthdays = [
        {
          id: "birthday-1",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
        },
        {
          id: "birthday-2",
          name: "Jane Smith",
          date: "1985-03-20",
          category: "Family",
        },
      ];

      mockPrisma.birthday.findMany.mockResolvedValue(existingBirthdays);

      const result = await SubmissionService.detectDuplicates(
        "user-123",
        submissionData,
      );

      expect(result.hasDuplicates).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].id).toBe("birthday-1");
      expect(result.matches[0].similarity).toBeGreaterThan(0.8);
    });

    it("should detect similar names with same date", async () => {
      const existingBirthdays = [
        {
          id: "birthday-1",
          name: "Jon Doe", // Similar name
          date: "1990-05-15", // Same date
          category: "Friend",
        },
      ];

      mockPrisma.birthday.findMany.mockResolvedValue(existingBirthdays);

      const result = await SubmissionService.detectDuplicates(
        "user-123",
        submissionData,
      );

      expect(result.hasDuplicates).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].similarity).toBeGreaterThan(0.8);
    });

    it("should not detect duplicates for different people", async () => {
      const existingBirthdays = [
        {
          id: "birthday-1",
          name: "Jane Smith",
          date: "1985-03-20",
          category: "Family",
        },
        {
          id: "birthday-2",
          name: "Bob Johnson",
          date: "1992-12-10",
          category: "Work",
        },
      ];

      mockPrisma.birthday.findMany.mockResolvedValue(existingBirthdays);

      const result = await SubmissionService.detectDuplicates(
        "user-123",
        submissionData,
      );

      expect(result.hasDuplicates).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.birthday.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await SubmissionService.detectDuplicates(
        "user-123",
        submissionData,
      );

      expect(result.hasDuplicates).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe("importSubmission", () => {
    const mockSubmission = {
      id: "submission-123",
      sharingLinkId: "link-123",
      name: "John Doe",
      date: "1990-05-15",
      category: "Friend",
      notes: "Great friend",
      submitterName: "Jane Smith",
      submitterEmail: "jane@example.com",
      relationship: "Friend",
      status: SubmissionStatus.PENDING,
      createdAt: new Date(),
      sharingLink: {
        id: "link-123",
        userId: "user-123",
      },
    };

    it("should successfully import a pending submission", async () => {
      mockPrisma.birthdaySubmission.findFirst.mockResolvedValue(mockSubmission);

      const mockBirthday = {
        id: "birthday-123",
        userId: "user-123",
        name: "John Doe",
        date: "1990-05-15",
        category: "Friend",
        notes: "Great friend",
        createdAt: new Date(),
      };
      mockPrisma.birthday.create.mockResolvedValue(mockBirthday);

      mockPrisma.birthdaySubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.IMPORTED,
      });

      const result = await SubmissionService.importSubmission(
        "submission-123",
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.birthdayId).toBe("birthday-123");

      expect(mockPrisma.birthday.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
          notes: "Great friend",
        },
      });

      expect(mockPrisma.birthdaySubmission.update).toHaveBeenCalledWith({
        where: { id: "submission-123" },
        data: { status: SubmissionStatus.IMPORTED },
      });
    });

    it("should reject import for non-existent submission", async () => {
      mockPrisma.birthdaySubmission.findFirst.mockResolvedValue(null);

      const result = await SubmissionService.importSubmission(
        "non-existent",
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Submission not found or already processed",
      ]);
    });

    it("should handle database errors during import", async () => {
      mockPrisma.birthdaySubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrisma.birthday.create.mockRejectedValue(new Error("Database error"));

      const result = await SubmissionService.importSubmission(
        "submission-123",
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Failed to import submission. Please try again.",
      ]);
    });
  });

  describe("rejectSubmission", () => {
    it("should successfully reject a pending submission", async () => {
      mockPrisma.birthdaySubmission.updateMany.mockResolvedValue({ count: 1 });

      const result = await SubmissionService.rejectSubmission(
        "submission-123",
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();

      expect(mockPrisma.birthdaySubmission.updateMany).toHaveBeenCalledWith({
        where: {
          id: "submission-123",
          status: SubmissionStatus.PENDING,
          sharingLink: {
            userId: "user-123",
          },
        },
        data: {
          status: SubmissionStatus.REJECTED,
        },
      });
    });

    it("should reject for non-existent or already processed submission", async () => {
      mockPrisma.birthdaySubmission.updateMany.mockResolvedValue({ count: 0 });

      const result = await SubmissionService.rejectSubmission(
        "non-existent",
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Submission not found or already processed",
      ]);
    });

    it("should handle database errors during rejection", async () => {
      mockPrisma.birthdaySubmission.updateMany.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await SubmissionService.rejectSubmission(
        "submission-123",
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Failed to reject submission. Please try again.",
      ]);
    });
  });

  describe("getPendingSubmissions", () => {
    it("should return pending submissions for user", async () => {
      const mockSubmissions = [
        {
          id: "submission-1",
          name: "John Doe",
          date: "1990-05-15",
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: {
            description: "Family link",
            createdAt: new Date(),
          },
        },
        {
          id: "submission-2",
          name: "Jane Smith",
          date: "1985-03-20",
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: {
            description: "Friends link",
            createdAt: new Date(),
          },
        },
      ];

      mockPrisma.birthdaySubmission.findMany.mockResolvedValue(mockSubmissions);

      const result = await SubmissionService.getPendingSubmissions("user-123");

      expect(result).toEqual(mockSubmissions);
      expect(mockPrisma.birthdaySubmission.findMany).toHaveBeenCalledWith({
        where: {
          status: SubmissionStatus.PENDING,
          sharingLink: {
            userId: "user-123",
          },
        },
        include: {
          sharingLink: {
            select: {
              description: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array on database error", async () => {
      mockPrisma.birthdaySubmission.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await SubmissionService.getPendingSubmissions("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("bulkImportSubmissions", () => {
    it("should successfully import multiple submissions", async () => {
      const submissionIds = ["sub-1", "sub-2", "sub-3"];

      // Mock successful imports
      mockPrisma.birthdaySubmission.findFirst
        .mockResolvedValueOnce({
          id: "sub-1",
          sharingLinkId: "link-123",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
          notes: null,
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: { id: "link-123", userId: "user-123" },
        })
        .mockResolvedValueOnce({
          id: "sub-2",
          sharingLinkId: "link-123",
          name: "Jane Smith",
          date: "1985-03-20",
          category: "Family",
          notes: null,
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: { id: "link-123", userId: "user-123" },
        })
        .mockResolvedValueOnce({
          id: "sub-3",
          sharingLinkId: "link-123",
          name: "Bob Johnson",
          date: "1992-12-10",
          category: "Work",
          notes: null,
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: { id: "link-123", userId: "user-123" },
        });

      mockPrisma.birthday.create
        .mockResolvedValueOnce({ id: "birthday-1" })
        .mockResolvedValueOnce({ id: "birthday-2" })
        .mockResolvedValueOnce({ id: "birthday-3" });

      mockPrisma.birthdaySubmission.update
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any);

      const result = await SubmissionService.bulkImportSubmissions(
        submissionIds,
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.imported).toBe(3);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle partial failures in bulk import", async () => {
      const submissionIds = ["sub-1", "sub-2"];

      // First import succeeds
      mockPrisma.birthdaySubmission.findFirst
        .mockResolvedValueOnce({
          id: "sub-1",
          sharingLinkId: "link-123",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
          notes: null,
          status: SubmissionStatus.PENDING,
          createdAt: new Date(),
          sharingLink: { id: "link-123", userId: "user-123" },
        })
        .mockResolvedValueOnce(null); // Second import fails

      mockPrisma.birthday.create.mockResolvedValueOnce({ id: "birthday-1" });
      mockPrisma.birthdaySubmission.update.mockResolvedValueOnce({} as any);

      const result = await SubmissionService.bulkImportSubmissions(
        submissionIds,
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.imported).toBe(1);
      expect(result.failed).toEqual(["sub-2"]);
      expect(result.errors).toContain(
        "Submission not found or already processed",
      );
    });
  });

  describe("bulkRejectSubmissions", () => {
    it("should successfully reject multiple submissions", async () => {
      const submissionIds = ["sub-1", "sub-2", "sub-3"];

      mockPrisma.birthdaySubmission.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });

      const result = await SubmissionService.bulkRejectSubmissions(
        submissionIds,
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.rejected).toBe(3);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle partial failures in bulk reject", async () => {
      const submissionIds = ["sub-1", "sub-2"];

      mockPrisma.birthdaySubmission.updateMany
        .mockResolvedValueOnce({ count: 1 }) // First succeeds
        .mockResolvedValueOnce({ count: 0 }); // Second fails

      const result = await SubmissionService.bulkRejectSubmissions(
        submissionIds,
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.rejected).toBe(1);
      expect(result.failed).toEqual(["sub-2"]);
      expect(result.errors).toContain(
        "Submission not found or already processed",
      );
    });
  });

  describe("cleanupOldRejectedSubmissions", () => {
    it("should clean up old rejected submissions", async () => {
      mockPrisma.birthdaySubmission.deleteMany.mockResolvedValue({ count: 5 });

      const result = await SubmissionService.cleanupOldRejectedSubmissions(30);

      expect(result).toBe(5);

      const expectedCutoffDate = new Date();
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - 30);

      expect(mockPrisma.birthdaySubmission.deleteMany).toHaveBeenCalledWith({
        where: {
          status: SubmissionStatus.REJECTED,
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it("should handle database errors during cleanup", async () => {
      mockPrisma.birthdaySubmission.deleteMany.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await SubmissionService.cleanupOldRejectedSubmissions(30);

      expect(result).toBe(0);
    });
  });

  describe("string similarity calculation", () => {
    it("should calculate exact match as 1.0", () => {
      // Access private method through any cast for testing
      const similarity = (SubmissionService as any).calculateStringSimilarity(
        "john doe",
        "john doe",
      );
      expect(similarity).toBe(1);
    });

    it("should calculate no match as 0.0", () => {
      const similarity = (SubmissionService as any).calculateStringSimilarity(
        "",
        "john doe",
      );
      expect(similarity).toBe(0);
    });

    it("should calculate partial similarity", () => {
      const similarity = (SubmissionService as any).calculateStringSimilarity(
        "john doe",
        "jon doe",
      );
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1);
    });
  });
});
