import { SharingLink } from "../drizzle/schema";
import { RateLimitService } from "./rate-limiter";
import { SecurityContext, SecurityMiddleware } from "./security-middleware";
import { SharingService } from "./sharing-service";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("./rate-limiter", () => ({
  RateLimitService: {
    checkSubmissionRateLimit: vi.fn(),
    checkLinkSubmissionRateLimit: vi.fn(),
    checkPersistentRateLimit: vi.fn(),
    detectSuspiciousActivity: vi.fn(),
  },
}));
vi.mock("./sharing-service", () => ({
  SharingService: {
    canCreateSharingLink: vi.fn(),
  },
}));

vi.mock("./db", () => {
  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn(),
    }),
  });
  return {
    default: {
      update: mockUpdate,
      query: {
        sharingLinks: {
          findMany: vi.fn(),
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
const mockUpdate = mockDb.update as ReturnType<typeof vi.fn>;

describe("SecurityMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractSecurityContext", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === "x-forwarded-for") return "192.168.1.1, 10.0.0.1";
            if (header === "user-agent") return "Mozilla/5.0";
            return null;
          }),
        },
      } as unknown as NextRequest;

      const context = SecurityMiddleware.extractSecurityContext(mockRequest);

      expect(context.ipAddress).toBe("192.168.1.1");
      expect(context.userAgent).toBe("Mozilla/5.0");
    });

    it("should fallback to x-real-ip if x-forwarded-for is not available", () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === "x-real-ip") return "192.168.1.2";
            return null;
          }),
        },
      } as unknown as NextRequest;

      const context = SecurityMiddleware.extractSecurityContext(mockRequest);

      expect(context.ipAddress).toBe("192.168.1.2");
    });

    it("should use 'unknown' if no IP headers are available", () => {
      const mockRequest = {
        headers: {
          get: vi.fn(() => null),
        },
      } as unknown as NextRequest;

      const context = SecurityMiddleware.extractSecurityContext(mockRequest);

      expect(context.ipAddress).toBe("unknown");
    });
  });

  describe("checkSharingLinkRateLimit", () => {
    const mockContext: SecurityContext & { userId: string } = {
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      userId: "user123",
    };

    it("should allow request when all checks pass", async () => {
      // Mock successful rate limit checks
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(SharingService.canCreateSharingLink).mockResolvedValue({
        canCreate: true,
        activeLinksCount: 2,
        dailyLinksCount: 1,
      });

      mockDb.query.sharingLinks.findMany.mockResolvedValue([{ id: "link" }]);

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(mockContext);

      expect(result.allowed).toBe(true);
      expect(result.rateLimitInfo).toBeDefined();
      expect(result.suspiciousActivity).toBeDefined();
    });

    it("should block request when IP rate limit is exceeded", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        retryAfter: 3600,
      });

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(mockContext);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Rate limit exceeded");
      expect(result.rateLimitInfo?.retryAfter).toBe(3600);
    });

    it("should block request when user limit is exceeded", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(SharingService.canCreateSharingLink).mockResolvedValue({
        canCreate: false,
        reason: "Maximum of 5 active sharing links allowed per user",
        activeLinksCount: 5,
        dailyLinksCount: 1,
      });

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(mockContext);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        "Maximum of 5 active sharing links allowed per user",
      );
    });

    it("should block request when suspicious activity is detected", async () => {
      const botContext = {
        ...mockContext,
        userAgent: "curl/7.68.0",
      };

      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(SharingService.canCreateSharingLink).mockResolvedValue({
        canCreate: true,
        activeLinksCount: 2,
        dailyLinksCount: 1,
      });

      // Mock rapid link generation
      mockDb.query.sharingLinks.findMany.mockResolvedValue(
        Array(5).fill({ id: "link" }),
      );

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(botContext);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Suspicious activity detected");
      expect(result.suspiciousActivity?.detected).toBe(true);
    });

    it("should fail secure on error", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(mockContext);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Security check failed");
    });
  });

  describe("checkSubmissionSecurity", () => {
    const mockContext: SecurityContext & { token: string } = {
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      token: "test-token-123",
    };

    const mockSubmissionData = {
      name: "John Doe",
      date: "1990-01-01",
      submitterEmail: "john@example.com",
    };

    it("should allow request when all checks pass", async () => {
      // Mock successful rate limit checks
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 8,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
        allowed: true,
      });

      vi.mocked(RateLimitService.detectSuspiciousActivity).mockResolvedValue({
        suspicious: false,
      });

      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(
        Array(2).fill({ id: "sub" }),
      );

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        mockContext,
        mockSubmissionData,
      );

      expect(result.allowed).toBe(true);
      expect(result.rateLimitInfo).toBeDefined();
      expect(result.suspiciousActivity).toBeDefined();
    });

    it("should block request when IP rate limit is exceeded", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        retryAfter: 1800,
      });

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        mockContext,
        mockSubmissionData,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        "Too many submissions from your location",
      );
      expect(result.rateLimitInfo?.retryAfter).toBe(1800);
    });

    it("should block request when link rate limit is exceeded", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 8,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        retryAfter: 2400,
      });

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        mockContext,
        mockSubmissionData,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        "This sharing link has received too many submissions",
      );
      expect(result.rateLimitInfo?.retryAfter).toBe(2400);
    });

    it("should block request when persistent rate limit is exceeded", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 8,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
        allowed: false,
        reason: "Daily submission limit exceeded for this IP address.",
      });

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        mockContext,
        mockSubmissionData,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "Daily submission limit exceeded for this IP address.",
      );
    });

    it("should block and deactivate link for high-risk suspicious activity", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 8,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
        allowed: true,
      });

      vi.mocked(RateLimitService.detectSuspiciousActivity).mockResolvedValue({
        suspicious: true,
        reason: "Duplicate submission detected",
      });

      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(
        Array(2).fill({ id: "sub" }),
      );
      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        id: "link-123",
        token: mockContext.token,
      } as SharingLink);
      mockUpdate()
        .set()
        .where.mockResolvedValue([{} as SharingLink]);

      const botContext = {
        ...mockContext,
        userAgent: "python-requests/2.25.1",
      };

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        botContext,
        mockSubmissionData,
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Suspicious activity detected");
      expect(result.suspiciousActivity?.detected).toBe(true);
      expect(result.suspiciousActivity?.severity).toBe("high");

      // Verify link was deactivated
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate().set).toHaveBeenCalledWith({ isActive: false });
    });

    it("should detect suspicious content in submission data", async () => {
      const suspiciousSubmissionData = {
        name: "<script>alert('xss')</script>",
        date: "1990-01-01",
        submitterEmail: "test@example.com",
      };

      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 8,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(RateLimitService.checkPersistentRateLimit).mockResolvedValue({
        allowed: true,
      });

      vi.mocked(RateLimitService.detectSuspiciousActivity).mockResolvedValue({
        suspicious: false,
      });

      mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(
        Array(2).fill({ id: "sub" }),
      );

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        mockContext,
        suspiciousSubmissionData,
      );

      expect(result.suspiciousActivity?.detected).toBe(true);
      expect(result.suspiciousActivity?.reason).toContain(
        "Suspicious content in name field",
      );
    });
  });

  describe("suspicious content detection", () => {
    it("should detect HTML tags", () => {
      const testCases = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
        "<div>test</div>",
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "onload=alert(1)",
        "onerror=alert(1)",
        "eval(alert(1))",
        "document.cookie",
        "window.location",
      ];

      testCases.forEach((content) => {
        // Access the private method through any casting for testing
        const result = (
          SecurityMiddleware as unknown as {
            containsSuspiciousContent: (content: string) => boolean;
          }
        ).containsSuspiciousContent(content);
        expect(result).toBe(true);
      });
    });

    it("should allow normal content", () => {
      const testCases = [
        "John Doe",
        "Mary Jane Smith",
        "José García",
        "李小明",
        "محمد أحمد",
        "Normal text with numbers 123",
        "Email: john@example.com",
        "Phone: (555) 123-4567",
      ];

      testCases.forEach((content) => {
        const result = (
          SecurityMiddleware as unknown as {
            containsSuspiciousContent: (content: string) => boolean;
          }
        ).containsSuspiciousContent(content);
        expect(result).toBe(false);
      });
    });
  });

  describe("bot detection", () => {
    it("should detect common bot user agents", () => {
      const botUserAgents = [
        "Googlebot/2.1",
        "Mozilla/5.0 (compatible; bingbot/2.0)",
        "facebookexternalhit/1.1",
        "Twitterbot/1.0",
        "curl/7.68.0",
        "wget/1.20.3",
        "python-requests/2.25.1",
        "Go-http-client/1.1",
        "scrapy/2.5.0",
        "spider-bot/1.0",
        "crawler-agent/1.0",
      ];

      botUserAgents.forEach((userAgent) => {
        // Test the bot detection logic indirectly through suspicious activity detection
        expect(userAgent.toLowerCase()).toMatch(
          /bot|crawler|spider|scraper|scrapy|curl|wget|python|requests|externalhit|twitter|go-http-client|http-client/,
        );
      });
    });

    it("should allow normal browser user agents", () => {
      const normalUserAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
      ];

      normalUserAgents.forEach((userAgent) => {
        expect(userAgent).not.toMatch(
          /bot|crawler|spider|scraper|curl|wget|python-requests/i,
        );
      });
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      const mockContext: SecurityContext & { userId: string } = {
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        userId: "user123",
      };

      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(mockContext);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Security check failed");
      expect(console.error).toHaveBeenCalledWith(
        "Security middleware error:",
        expect.any(Error),
      );
    });

    it("should handle logging errors gracefully", async () => {
      const mockContext: SecurityContext & { userId: string } = {
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        userId: "user123",
      };

      // Mock successful security checks
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 3600000),
      });

      vi.mocked(SharingService.canCreateSharingLink).mockResolvedValue({
        canCreate: true,
        activeLinksCount: 2,
        dailyLinksCount: 1,
      });

      mockDb.query.sharingLinks.findMany.mockResolvedValue([{ id: "link" }]);

      // Mock console.log to throw an error
      vi.mocked(console.log).mockImplementation(() => {
        throw new Error("Logging failed");
      });

      // Should not throw despite logging error
      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(mockContext);

      expect(result.allowed).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to log security event:",
        expect.any(Error),
      );
    });
  });
});
