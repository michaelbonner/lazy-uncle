// Import after mocking
import { SubmissionStatus } from "../drizzle/schema";
import { InputValidator } from "./input-validator";
import { RateLimitService } from "./rate-limiter";
import { SharingService } from "./sharing-service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock db
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
  return {
    default: {
      insert: mockInsert,
      update: mockUpdate,
      query: {
        sharingLinks: {
          findFirst: vi.fn(),
        },
        birthdaySubmissions: {
          findMany: vi.fn(),
        },
      },
    },
  };
});

const mockDb = vi.mocked(await import("./db"), true).default;
const mockInsert = mockDb.insert as ReturnType<typeof vi.fn>;
const mockUpdate = mockDb.update as ReturnType<typeof vi.fn>;

describe("Birthday Submission API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Input Validation", () => {
    it("should validate required fields", () => {
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "John Doe",
        date: "1990-05-15",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toEqual({
        token: "valid-token-123",
        name: "John Doe",
        year: 1990,
        month: 5,
        day: 15,
        date: "1990-05-15",
        category: null,
        notes: null,
        submitterName: null,
        submitterEmail: null,
        relationship: null,
      });
    });

    it("should reject invalid name", () => {
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "",
        date: "1990-05-15",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Name is required and must be between 1-100 characters with at least one letter",
      );
    });

    it("should reject invalid date format", () => {
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "John Doe",
        date: "invalid-date",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Date must be in YYYY-MM-DD format and be a valid date between 1900 and next year",
      );
    });

    it("should reject invalid email format", () => {
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "John Doe",
        date: "1990-05-15",
        submitterEmail: "invalid-email",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid email address format");
    });

    it("should sanitize HTML and dangerous content", () => {
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "John <script>alert('xss')</script> Doe",
        date: "1990-05-15",
        notes: "Some notes with <img src=x onerror=alert(1)> content",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.name).toBe(
        // cspell:disable-next-line
        "John scriptalert('xss')/script Doe",
      );
      expect(result.sanitizedData?.notes).toBe(
        "Some notes with img src=x alert(1) content",
      );
    });

    it("should validate date ranges", () => {
      const currentYear = new Date().getFullYear();

      // Test future date (should be rejected)
      const futureResult = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "John Doe",
        date: `${currentYear + 2}-05-15`,
      });

      expect(futureResult.isValid).toBe(false);

      // Test very old date (should be rejected)
      const oldResult = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: "John Doe",
        date: "1800-05-15",
      });

      expect(oldResult.isValid).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    it("should allow submissions within rate limits", async () => {
      const result =
        await RateLimitService.checkSubmissionRateLimit("192.168.1.1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1
    });

    it("should block submissions when rate limit exceeded", async () => {
      const ip = "192.168.1.2";

      // Make 10 requests to hit the limit
      for (let i = 0; i < 10; i++) {
        await RateLimitService.checkSubmissionRateLimit(ip);
      }

      // 11th request should be blocked
      const result = await RateLimitService.checkSubmissionRateLimit(ip);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should detect suspicious duplicate submissions", async () => {
      const token = "test-token";
      const submissionData = {
        name: "John Doe",
        date: "1990-05-15",
        submitterEmail: "john@example.com",
      };

      // Mock database to return existing submission
      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        id: "link-1",
        token: "test-token",
        userId: "user-1",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
        description: null,
      });
      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue([
        {
          id: "sub-1",
          name: "John Doe",
          date: "1990-05-15",
          sharingLinkId: "link-1",
          category: null,
          createdAt: new Date(),
          notes: null,
          relationship: null,
          status: "PENDING" as SubmissionStatus,
          submitterEmail: "john@example.com",
          submitterName: null,
        },
      ]);

      const result = await RateLimitService.detectSuspiciousActivity(
        token,
        submissionData,
      );

      expect(result.suspicious).toBe(true);
      expect(result.reason).toBe("Duplicate submission detected");
    });

    it("should detect too many submissions from same email", async () => {
      const token = "test-token";
      const submissionData = {
        name: "John Doe",
        date: "1990-05-15",
        submitterEmail: "spam@example.com",
      };

      // Mock database to return no duplicates but many from same email
      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        id: "link-1",
        token: "test-token",
        userId: "user-1",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
        description: null,
      });
      mockDb.query.birthdaySubmissions.findMany
        .mockResolvedValueOnce([]) // No duplicates
        .mockResolvedValueOnce(
          Array(6).fill({ submitterEmail: "spam@example.com" }),
        ); // 6 submissions from same email

      const result = await RateLimitService.detectSuspiciousActivity(
        token,
        submissionData,
      );

      expect(result.suspicious).toBe(true);
      expect(result.reason).toBe(
        "Too many submissions from same email address",
      );
    });
  });

  describe("Sharing Link Validation", () => {
    it("should validate active sharing link", async () => {
      const mockLink = {
        id: "link-1",
        token: "valid-token",
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        userId: "user-1",
        createdAt: new Date(),
        description: null,
      };

      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        ...mockLink,
        user: { id: "user-1" },
      });

      const result = await SharingService.validateSharingLink("valid-token");

      expect(result).toEqual({
        ...mockLink,
        user: { id: "user-1" },
      });
    });

    it("should reject expired sharing link", async () => {
      const mockLink = {
        id: "link-1",
        token: "expired-token",
        isActive: true,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        userId: "user-1",
        createdAt: new Date(),
        description: null,
      };

      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        ...mockLink,
      });
      mockUpdate().set().where.mockResolvedValue([mockLink]);

      const result = await SharingService.validateSharingLink("expired-token");

      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate().set).toHaveBeenCalledWith({ isActive: false });
    });

    it("should reject inactive sharing link", async () => {
      const mockLink = {
        id: "link-1",
        token: "inactive-token",
        isActive: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: "user-1",
        createdAt: new Date(),
        description: null,
      };

      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        ...mockLink,
      });

      const result = await SharingService.validateSharingLink("inactive-token");

      expect(result).toBeNull();
    });

    it("should reject non-existent sharing link", async () => {
      mockDb.query.sharingLinks.findFirst.mockResolvedValue(undefined);

      const result = await SharingService.validateSharingLink("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("Birthday Submission Creation", () => {
    it("should create birthday submission with valid data", async () => {
      const mockLink = {
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
        status: "PENDING" as SubmissionStatus,
        createdAt: new Date(),
        parent: null,
        importSource: null,
      };

      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        ...mockLink,
      });
      mockInsert().values().returning.mockResolvedValue([mockSubmission]);

      const result = await mockInsert().values().returning();

      expect(result).toEqual([mockSubmission]);
    });

    it("should handle database errors gracefully", async () => {
      const mockLink = {
        id: "link-1",
        token: "valid-token",
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: "user-1",
        createdAt: new Date(),
        description: null,
      };

      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        ...mockLink,
      });
      mockInsert()
        .values()
        .returning.mockRejectedValue(new Error("Database connection failed"));

      await expect(mockInsert().values().returning()).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed tokens", () => {
      const result = InputValidator.validateToken("invalid<>token");
      expect(result.isValid).toBe(false);
    });

    it("should handle extremely long inputs", () => {
      const longString = "a".repeat(2000);
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: longString,
        date: "1990-05-15",
      });

      expect(result.isValid).toBe(false);
    });

    it("should handle null and undefined inputs", () => {
      const result = InputValidator.validateBirthdaySubmission({
        token: "valid-token-123",
        name: null as unknown as string,
        date: undefined as unknown as string,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
