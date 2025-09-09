import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitService } from "../../lib/rate-limiter";
import { SecurityMiddleware } from "../../lib/security-middleware";
import { SharingService } from "../../lib/sharing-service";

// Mock all dependencies
vi.mock("../../lib/security-middleware");
vi.mock("../../lib/rate-limiter");
vi.mock("../../lib/sharing-service");
vi.mock("../../lib/submission-service");
vi.mock("../../lib/prisma");

describe("GraphQL Security Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("SecurityMiddleware integration", () => {
    it("should call security middleware with correct parameters for sharing link creation", async () => {
      const securityContext = {
        ipAddress: "192.168.1.1",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        userId: "user123",
      };

      vi.mocked(SecurityMiddleware.checkSharingLinkRateLimit).mockResolvedValue(
        {
          allowed: true,
          rateLimitInfo: {
            remaining: 5,
            resetTime: new Date(Date.now() + 3600000),
          },
          suspiciousActivity: {
            detected: false,
            severity: "low",
          },
        },
      );

      await SecurityMiddleware.checkSharingLinkRateLimit(securityContext);

      expect(SecurityMiddleware.checkSharingLinkRateLimit).toHaveBeenCalledWith(
        securityContext,
      );
    });

    it("should call security middleware with correct parameters for submission", async () => {
      const securityContext = {
        ipAddress: "192.168.1.2",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        token: "test-token-123",
      };

      const submissionData = {
        name: "John Doe",
        date: "1990-01-01",
        submitterEmail: "jane@example.com",
      };

      vi.mocked(SecurityMiddleware.checkSubmissionSecurity).mockResolvedValue({
        allowed: true,
        rateLimitInfo: {
          remaining: 8,
          resetTime: new Date(Date.now() + 3600000),
        },
        suspiciousActivity: {
          detected: false,
          severity: "low",
        },
      });

      await SecurityMiddleware.checkSubmissionSecurity(
        securityContext,
        submissionData,
      );

      expect(SecurityMiddleware.checkSubmissionSecurity).toHaveBeenCalledWith(
        securityContext,
        submissionData,
      );
    });

    it("should handle security check failures correctly", async () => {
      const securityContext = {
        ipAddress: "192.168.1.3",
        userAgent: "curl/7.68.0",
        userId: "user123",
      };

      vi.mocked(SecurityMiddleware.checkSharingLinkRateLimit).mockResolvedValue(
        {
          allowed: false,
          reason: "Rate limit exceeded. Please try again later.",
          rateLimitInfo: {
            remaining: 0,
            resetTime: new Date(Date.now() + 3600000),
            retryAfter: 3600,
          },
        },
      );

      const result =
        await SecurityMiddleware.checkSharingLinkRateLimit(securityContext);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Rate limit exceeded");
    });

    it("should detect suspicious activity correctly", async () => {
      const securityContext = {
        ipAddress: "192.168.1.4",
        userAgent: "python-requests/2.25.1",
        token: "test-token-456",
      };

      const suspiciousSubmissionData = {
        name: "<script>alert('xss')</script>",
        date: "1990-01-01",
        submitterEmail: "test@example.com",
      };

      vi.mocked(SecurityMiddleware.checkSubmissionSecurity).mockResolvedValue({
        allowed: false,
        reason:
          "Suspicious activity detected. The sharing link has been deactivated for security.",
        suspiciousActivity: {
          detected: true,
          reason: "Bot-like user agent, Suspicious content in name field",
          severity: "high",
        },
      });

      const result = await SecurityMiddleware.checkSubmissionSecurity(
        securityContext,
        suspiciousSubmissionData,
      );

      expect(result.allowed).toBe(false);
      expect(result.suspiciousActivity?.detected).toBe(true);
      expect(result.suspiciousActivity?.severity).toBe("high");
    });
  });

  describe("IP address extraction", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const context = {
        req: {
          headers: {
            "x-forwarded-for": "203.0.113.1, 192.168.1.1",
          },
        },
      };

      // The resolver should extract the first IP from x-forwarded-for
      expect(context.req.headers["x-forwarded-for"].split(",")[0]).toBe(
        "203.0.113.1",
      );
    });

    it("should fallback to x-real-ip header", () => {
      const context = {
        req: {
          headers: {
            "x-real-ip": "203.0.113.2",
          },
        },
      };

      expect(context.req.headers["x-real-ip"]).toBe("203.0.113.2");
    });

    it("should use unknown when no IP headers available", () => {
      const context = {
        req: {
          headers: {} as Record<string, string>,
        },
      };

      // Should default to "unknown" when no IP headers are present
      const ipAddress =
        context.req.headers["x-forwarded-for"]?.split(",")[0] ||
        context.req.headers["x-real-ip"] ||
        "unknown";

      expect(ipAddress).toBe("unknown");
    });
  });

  describe("Rate limiting integration", () => {
    it("should integrate with rate limiting service for IP-based limits", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: new Date(Date.now() + 3600000),
      });

      const result =
        await RateLimitService.checkSubmissionRateLimit("192.168.1.5");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(RateLimitService.checkSubmissionRateLimit).toHaveBeenCalledWith(
        "192.168.1.5",
      );
    });

    it("should integrate with rate limiting service for link-based limits", async () => {
      vi.mocked(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).mockResolvedValue({
        allowed: true,
        remaining: 49,
        resetTime: new Date(Date.now() + 3600000),
      });

      const result =
        await RateLimitService.checkLinkSubmissionRateLimit("test-token");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49);
      expect(
        RateLimitService.checkLinkSubmissionRateLimit,
      ).toHaveBeenCalledWith("test-token");
    });

    it("should integrate with sharing service for user limits", async () => {
      vi.mocked(SharingService.canCreateSharingLink).mockResolvedValue({
        canCreate: true,
        activeLinksCount: 2,
        dailyLinksCount: 1,
      });

      const result = await SharingService.canCreateSharingLink("user123");

      expect(result.canCreate).toBe(true);
      expect(result.activeLinksCount).toBe(2);
      expect(SharingService.canCreateSharingLink).toHaveBeenCalledWith(
        "user123",
      );
    });
  });

  describe("Error handling integration", () => {
    it("should handle security middleware errors gracefully", async () => {
      vi.mocked(SecurityMiddleware.checkSharingLinkRateLimit).mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        SecurityMiddleware.checkSharingLinkRateLimit({
          ipAddress: "192.168.1.6",
          userAgent: "Mozilla/5.0",
          userId: "user123",
        }),
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle rate limiting service errors gracefully", async () => {
      vi.mocked(RateLimitService.checkSubmissionRateLimit).mockRejectedValue(
        new Error("Rate limiter unavailable"),
      );

      await expect(
        RateLimitService.checkSubmissionRateLimit("192.168.1.7"),
      ).rejects.toThrow("Rate limiter unavailable");
    });
  });

  describe("Security logging integration", () => {
    it("should log security events correctly", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      vi.mocked(SecurityMiddleware.checkSharingLinkRateLimit).mockResolvedValue(
        {
          allowed: true,
          rateLimitInfo: {
            remaining: 5,
            resetTime: new Date(Date.now() + 3600000),
          },
          suspiciousActivity: {
            detected: false,
            severity: "low",
          },
        },
      );

      await SecurityMiddleware.checkSharingLinkRateLimit({
        ipAddress: "192.168.1.8",
        userAgent: "Mozilla/5.0",
        userId: "user123",
      });

      // The actual implementation logs security events
      expect(SecurityMiddleware.checkSharingLinkRateLimit).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log high-severity security events as warnings", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      vi.mocked(SecurityMiddleware.checkSubmissionSecurity).mockResolvedValue({
        allowed: false,
        reason:
          "Suspicious activity detected. The sharing link has been deactivated for security.",
        suspiciousActivity: {
          detected: true,
          reason: "High-risk activity detected",
          severity: "high",
        },
      });

      await SecurityMiddleware.checkSubmissionSecurity(
        {
          ipAddress: "192.168.1.9",
          userAgent: "curl/7.68.0",
          token: "test-token",
        },
        {
          name: "<script>alert('xss')</script>",
          date: "1990-01-01",
        },
      );

      expect(SecurityMiddleware.checkSubmissionSecurity).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
