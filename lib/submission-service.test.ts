import { BirthdaySubmission, SubmissionStatus } from "../drizzle/schema";
import { InputValidator } from "./input-validator";
import { SharingService } from "./sharing-service";
import { SubmissionService } from "./submission-service";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("./db", () => {
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  });
  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn(),
    }),
  });
  const mockDelete = vi.fn().mockReturnValue({
    where: vi.fn(),
  });
  return {
    default: {
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      query: {
        birthdays: {
          findMany: vi.fn(),
        },
        birthdaySubmissions: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        sharingLinks: {
          findMany: vi.fn(),
        },
      },
    },
  };
});

vi.mock("./sharing-service");
vi.mock("./input-validator");
vi.mock("./notification-service", () => ({
  notificationService: {
    queueNotification: vi.fn(),
    sendSubmissionNotification: vi.fn(),
    getUserNotificationPreferences: vi.fn(),
  },
}));

const mockDb = vi.mocked(await import("./db"), true).default;
const mockInsert = mockDb.insert as ReturnType<typeof vi.fn>;
const mockUpdate = mockDb.update as ReturnType<typeof vi.fn>;
const mockDelete = mockDb.delete as ReturnType<typeof vi.fn>;
const mockSharingService = vi.mocked(SharingService);
const mockInputValidator = vi.mocked(InputValidator);
const { notificationService: mockNotificationService } = vi.mocked(
  await import("./notification-service"),
  true,
);

describe("SubmissionService", () => {
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
    status: "PENDING" as SubmissionStatus,
    createdAt: new Date(),
    sharingLink: {
      id: "link-123",
      userId: "user-123",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock notification service methods
    mockNotificationService.queueNotification.mockResolvedValue();
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
      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue([]);

      // Mock submission creation
      const mockSubmission = {
        id: "submission-123",
        sharingLinkId: "link-123",
        ...validSubmissionData,
        status: "PENDING" as SubmissionStatus,
        createdAt: new Date(),
      };
      mockInsert().values().returning.mockResolvedValue([mockSubmission]);

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
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          sharingLinkId: "link-123",
          name: validSubmissionData.name,
          date: validSubmissionData.date,
          category: validSubmissionData.category,
          notes: validSubmissionData.notes,
          submitterName: validSubmissionData.submitterName,
          submitterEmail: validSubmissionData.submitterEmail,
          relationship: validSubmissionData.relationship,
          status: "PENDING",
        }),
      );
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
      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(
        Array(15).fill({ id: "sub", createdAt: new Date() }),
      );

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

      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue([]);
      mockInsert()
        .values()
        .returning.mockRejectedValue(new Error("Database error"));

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
          userId: "user-123",
          createdAt: new Date(),
          parent: null,
          notes: null,
          importSource: null,
        },
        {
          id: "birthday-2",
          name: "Jane Smith",
          date: "1985-03-20",
          category: "Family",
          userId: "user-123",
          createdAt: new Date(),
          parent: null,
          notes: null,
          importSource: null,
        },
      ];

      mockDb.query.birthdays.findMany.mockResolvedValue(existingBirthdays);

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
          userId: "user-123",
          createdAt: new Date(),
          parent: null,
          notes: null,
          importSource: null,
        },
      ];

      mockDb.query.birthdays.findMany.mockResolvedValue(existingBirthdays);

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
          userId: "user-123",
          createdAt: new Date(),
          parent: null,
          notes: null,
          importSource: null,
        },
        {
          id: "birthday-2",
          name: "Bob Johnson",
          date: "1992-12-10",
          category: "Work",
          userId: "user-123",
          createdAt: new Date(),
          parent: null,
          notes: null,
          importSource: null,
        },
      ];

      mockDb.query.birthdays.findMany.mockResolvedValue(existingBirthdays);

      const result = await SubmissionService.detectDuplicates(
        "user-123",
        submissionData,
      );

      expect(result.hasDuplicates).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      mockDb.query.birthdays.findMany.mockRejectedValue(
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
    it("should successfully import a pending submission", async () => {
      mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue(
        mockSubmission,
      );

      const mockBirthday = {
        id: "birthday-123",
        userId: "user-123",
        name: "John Doe",
        date: "1990-05-15",
        category: "Friend",
        notes: "Great friend",
        createdAt: new Date(),
        parent: null,
        importSource: null,
      };
      mockInsert().values().returning.mockResolvedValue([mockBirthday]);

      mockUpdate()
        .set()
        .where.mockResolvedValue([
          {
            ...mockSubmission,
            status: "IMPORTED" as SubmissionStatus,
          },
        ]);

      const result = await SubmissionService.importSubmission(
        "submission-123",
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.birthdayId).toBe("birthday-123");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
          notes: "Great friend",
          importSource: "sharing",
        }),
      );

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate().set).toHaveBeenCalledWith({ status: "IMPORTED" });
    });

    it("should reject import for non-existent submission", async () => {
      mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue(undefined);

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
      mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue(
        mockSubmission,
      );
      mockInsert()
        .values()
        .returning.mockRejectedValue(new Error("Database error"));

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
      mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue({
        ...mockSubmission,
        sharingLink: { userId: "user-123" },
      });
      mockUpdate()
        .set()
        .where.mockResolvedValue([
          {
            ...mockSubmission,
            status: "REJECTED" as SubmissionStatus,
          },
        ]);

      const result = await SubmissionService.rejectSubmission(
        "submission-123",
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate().set).toHaveBeenCalledWith({ status: "REJECTED" });
    });

    it("should reject for non-existent or already processed submission", async () => {
      mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue(undefined);

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
      mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue({
        ...mockSubmission,
        sharingLink: { userId: "user-123" },
      });
      mockUpdate().set().where.mockRejectedValue(new Error("Database error"));

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
          status: "PENDING" as SubmissionStatus,
          createdAt: new Date(),
          sharingLink: {
            description: "Family link",
            createdAt: new Date(),
          },
          sharingLinkId: "link-123",
          category: "Friend",
          notes: null,
          submitterName: "Jane Smith",
          submitterEmail: "jane@example.com",
          relationship: "Friend",
        },
        {
          id: "submission-2",
          name: "Jane Smith",
          date: "1985-03-20",
          status: "PENDING" as SubmissionStatus,
          createdAt: new Date(),
          sharingLink: {
            description: "Friends link",
            createdAt: new Date(),
          },
          sharingLinkId: "link-123",
          category: "Family",
          notes: null,
          submitterName: "Jane Smith",
          submitterEmail: "jane@example.com",
          relationship: "Family",
        },
      ];

      mockDb.query.sharingLinks.findMany.mockResolvedValue([
        { id: "link-123" },
      ]);
      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(
        mockSubmissions,
      );

      const result = await SubmissionService.getPendingSubmissions("user-123");

      expect(result).toEqual(mockSubmissions);
      expect(mockDb.query.birthdaySubmissions.findMany).toHaveBeenCalled();
    });

    it("should return empty array on database error", async () => {
      mockDb.query.sharingLinks.findMany.mockRejectedValue(
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
      mockDb.query.birthdaySubmissions.findFirst
        .mockResolvedValueOnce({
          id: "sub-1",
          sharingLinkId: "link-123",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
          notes: null,
          status: "PENDING" as SubmissionStatus,
          createdAt: new Date(),
          submitterName: "Jane Smith",
          submitterEmail: "jane@example.com",
          relationship: "Friend",
          sharingLink: { userId: "user-123" },
        })
        .mockResolvedValueOnce({
          id: "sub-2",
          sharingLinkId: "link-123",
          name: "Jane Smith",
          date: "1985-03-20",
          category: "Family",
          notes: null,
          status: "PENDING" as SubmissionStatus,
          createdAt: new Date(),
          submitterName: "Jane Smith",
          submitterEmail: "jane@example.com",
          relationship: "Friend",
          sharingLink: { userId: "user-123" },
        })
        .mockResolvedValueOnce({
          id: "sub-3",
          sharingLinkId: "link-123",
          name: "Bob Johnson",
          date: "1992-12-10",
          category: "Work",
          notes: null,
          status: "PENDING" as SubmissionStatus,
          createdAt: new Date(),
          submitterName: "Jane Smith",
          submitterEmail: "jane@example.com",
          relationship: "Friend",
          sharingLink: { userId: "user-123" },
        });

      mockInsert()
        .values()
        .returning.mockResolvedValueOnce([
          {
            id: "birthday-1",
            name: "John Doe",
            date: "1990-05-15",
            category: "Friend",
            notes: null,
            createdAt: new Date(),
            userId: "user-123",
            parent: null,
            importSource: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "birthday-2",
            name: "Jane Smith",
            date: "1985-03-20",
            category: "Family",
            notes: null,
            createdAt: new Date(),
            userId: "user-123",
            parent: null,
            importSource: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "birthday-3",
            name: "Bob Johnson",
            date: "1992-12-10",
            category: "Work",
            notes: null,
            createdAt: new Date(),
            userId: "user-123",
            parent: null,
            importSource: null,
          },
        ]);

      mockUpdate()
        .set()
        .where.mockResolvedValueOnce([{} as BirthdaySubmission])
        .mockResolvedValueOnce([{} as BirthdaySubmission])
        .mockResolvedValueOnce([{} as BirthdaySubmission]);

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
      mockDb.query.birthdaySubmissions.findFirst
        .mockResolvedValueOnce({
          id: "sub-1",
          sharingLinkId: "link-123",
          name: "John Doe",
          date: "1990-05-15",
          category: "Friend",
          notes: null,
          status: "PENDING" as SubmissionStatus,
          createdAt: new Date(),
          submitterName: "Jane Smith",
          submitterEmail: "jane@example.com",
          relationship: "Friend",
          sharingLink: { userId: "user-123" },
        })
        .mockResolvedValueOnce(undefined); // Second import fails

      mockInsert()
        .values()
        .returning.mockResolvedValueOnce([
          {
            id: "birthday-1",
            name: "John Doe",
            date: "1990-05-15",
            category: "Friend",
            notes: null,
            createdAt: new Date(),
            userId: "user-123",
            parent: null,
            importSource: null,
          },
        ]);
      mockUpdate()
        .set()
        .where.mockResolvedValueOnce([{} as BirthdaySubmission]);

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

      mockDb.query.birthdaySubmissions.findFirst
        .mockResolvedValueOnce({
          ...mockSubmission,
          sharingLink: { userId: "user-123" },
        })
        .mockResolvedValueOnce({
          ...mockSubmission,
          sharingLink: { userId: "user-123" },
        })
        .mockResolvedValueOnce({
          ...mockSubmission,
          sharingLink: { userId: "user-123" },
        });

      mockUpdate()
        .set()
        .where.mockResolvedValueOnce([{} as BirthdaySubmission])
        .mockResolvedValueOnce([{} as BirthdaySubmission])
        .mockResolvedValueOnce([{} as BirthdaySubmission]);

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

      mockDb.query.birthdaySubmissions.findFirst
        .mockResolvedValueOnce({
          ...mockSubmission,
          sharingLink: { userId: "user-123" },
        }) // First succeeds
        .mockResolvedValueOnce(undefined); // Second fails

      mockUpdate()
        .set()
        .where.mockResolvedValueOnce([{} as BirthdaySubmission]);

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
      const oldSubmissions = Array(5).fill({
        id: "sub-1",
        status: "REJECTED" as SubmissionStatus,
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      });
      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(
        oldSubmissions,
      );
      mockDelete().where.mockResolvedValue([{}]);

      const result = await SubmissionService.cleanupOldRejectedSubmissions(30);

      expect(result).toBe(5);
    });

    it("should handle database errors during cleanup", async () => {
      mockDb.query.birthdaySubmissions.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await SubmissionService.cleanupOldRejectedSubmissions(30);

      expect(result).toBe(0);
    });
  });

  describe("string similarity calculation", () => {
    it("should calculate exact match as 1.0", () => {
      // Access private method through any cast for testing
      const similarity = (
        SubmissionService as unknown as {
          calculateStringSimilarity: (a: string, b: string) => number;
        }
      ).calculateStringSimilarity("john doe", "john doe");
      expect(similarity).toBe(1);
    });

    it("should calculate no match as 0.0", () => {
      const similarity = (
        SubmissionService as unknown as {
          calculateStringSimilarity: (a: string, b: string) => number;
        }
      ).calculateStringSimilarity("", "john doe");
      expect(similarity).toBe(0);
    });

    it("should calculate partial similarity", () => {
      const similarity = (
        SubmissionService as unknown as {
          calculateStringSimilarity: (a: string, b: string) => number;
        }
      ).calculateStringSimilarity("john doe", "jon doe");
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1);
    });
  });
});
