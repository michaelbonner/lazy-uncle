import { and, eq, gte } from "drizzle-orm";
import { NextRequest } from "next/server";
import { sharingLinks } from "../drizzle/schema";
import db from "./db";
import { RateLimitService } from "./rate-limiter";
import { SharingService } from "./sharing-service";

export interface SecurityContext {
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  token?: string;
}

export interface SecurityResult {
  allowed: boolean;
  reason?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
  };
  suspiciousActivity?: {
    detected: boolean;
    reason?: string;
    severity: "low" | "medium" | "high";
  };
}

export interface SecurityLogEntry {
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  action: string;
  endpoint: string;
  result: "allowed" | "blocked";
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security middleware for sharing endpoints with comprehensive protection
 */
export class SecurityMiddleware {
  private static readonly SUSPICIOUS_PATTERNS = {
    // Common bot user agents
    BOT_USER_AGENTS: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /scrapy/i,
      /curl/i,
      /wget/i,
      /python/i,
      /requests/i,
      /externalhit/i,
      /twitter/i,
      /go-http-client/i,
      /http-client/i,
    ],

    // Suspicious submission patterns
    RAPID_SUBMISSIONS: {
      threshold: 5,
      windowMs: 60 * 1000, // 1 minute
    },

    // Suspicious link generation patterns
    RAPID_LINK_GENERATION: {
      threshold: 3,
      windowMs: 5 * 60 * 1000, // 5 minutes
    },
  };

  /**
   * Extract security context from request
   */
  static extractSecurityContext(request: NextRequest): SecurityContext {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";

    return {
      ipAddress: ipAddress.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    };
  }

  /**
   * Check rate limits for sharing link creation
   */
  static async checkSharingLinkRateLimit(
    context: SecurityContext & { userId: string },
  ): Promise<SecurityResult> {
    try {
      // Check IP-based rate limiting (stricter for link creation)
      const ipResult = await RateLimitService.checkSubmissionRateLimit(
        context.ipAddress,
      );

      if (!ipResult.allowed) {
        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          userId: context.userId,
          action: "create_sharing_link",
          endpoint: "/api/graphql",
          result: "blocked",
          reason: "IP rate limit exceeded",
          metadata: { rateLimitInfo: ipResult },
        });

        return {
          allowed: false,
          reason: "Rate limit exceeded. Please try again later.",
          rateLimitInfo: {
            remaining: ipResult.remaining,
            resetTime: ipResult.resetTime,
            retryAfter: ipResult.retryAfter,
          },
        };
      }

      // Check user-specific rate limiting using sharing service
      const userLimitCheck = await SharingService.canCreateSharingLink(
        context.userId,
      );

      if (!userLimitCheck.canCreate) {
        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          userId: context.userId,
          action: "create_sharing_link",
          endpoint: "/api/graphql",
          result: "blocked",
          reason: userLimitCheck.reason || "User limit exceeded",
          metadata: { userLimitCheck },
        });

        return {
          allowed: false,
          reason: userLimitCheck.reason || "User limit exceeded",
        };
      }

      // Check for suspicious activity patterns
      const suspiciousActivity =
        await this.detectSuspiciousLinkGeneration(context);

      if (
        suspiciousActivity.detected &&
        suspiciousActivity.severity === "high"
      ) {
        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          userId: context.userId,
          action: "create_sharing_link",
          endpoint: "/api/graphql",
          result: "blocked",
          reason: "Suspicious activity detected",
          metadata: { suspiciousActivity },
        });

        return {
          allowed: false,
          reason:
            "Suspicious activity detected. Please contact support if this is an error.",
          suspiciousActivity,
        };
      }

      // Log successful check
      await this.logSecurityEvent({
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: context.userId,
        action: "create_sharing_link",
        endpoint: "/api/graphql",
        result: "allowed",
        metadata: {
          rateLimitInfo: ipResult,
          userLimitCheck,
          suspiciousActivity,
        },
      });

      return {
        allowed: true,
        rateLimitInfo: {
          remaining: ipResult.remaining,
          resetTime: ipResult.resetTime,
        },
        suspiciousActivity,
      };
    } catch (error) {
      console.error("Security middleware error:", error);

      await this.logSecurityEvent({
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: context.userId,
        action: "create_sharing_link",
        endpoint: "/api/graphql",
        result: "blocked",
        reason: "Security check failed",
        metadata: { error: (error as Error).message },
      });

      // Fail secure - block on error
      return {
        allowed: false,
        reason: "Security check failed. Please try again.",
      };
    }
  }

  /**
   * Check rate limits and security for birthday submissions
   */
  static async checkSubmissionSecurity(
    context: SecurityContext & { token: string },
    submissionData: {
      name: string;
      date: string;
      submitterEmail?: string;
    },
  ): Promise<SecurityResult> {
    try {
      // Check IP-based rate limiting
      const ipResult = await RateLimitService.checkSubmissionRateLimit(
        context.ipAddress,
      );

      if (!ipResult.allowed) {
        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          action: "submit_birthday",
          endpoint: "/api/graphql",
          result: "blocked",
          reason: "IP rate limit exceeded",
          metadata: { rateLimitInfo: ipResult },
        });

        return {
          allowed: false,
          reason:
            "Too many submissions from your location. Please try again later.",
          rateLimitInfo: {
            remaining: ipResult.remaining,
            resetTime: ipResult.resetTime,
            retryAfter: ipResult.retryAfter,
          },
        };
      }

      // Check link-specific rate limiting
      const linkResult = await RateLimitService.checkLinkSubmissionRateLimit(
        context.token,
      );

      if (!linkResult.allowed) {
        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          action: "submit_birthday",
          endpoint: "/api/graphql",
          result: "blocked",
          reason: "Link rate limit exceeded",
          metadata: { rateLimitInfo: linkResult },
        });

        return {
          allowed: false,
          reason:
            "This sharing link has received too many submissions. Please try again later.",
          rateLimitInfo: {
            remaining: linkResult.remaining,
            resetTime: linkResult.resetTime,
            retryAfter: linkResult.retryAfter,
          },
        };
      }

      // Check persistent rate limiting (database-based)
      const persistentResult = await RateLimitService.checkPersistentRateLimit(
        context.ipAddress,
      );

      if (!persistentResult.allowed) {
        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          action: "submit_birthday",
          endpoint: "/api/graphql",
          result: "blocked",
          reason: persistentResult.reason || "Persistent rate limit exceeded",
        });

        return {
          allowed: false,
          reason: persistentResult.reason || "Rate limit exceeded",
        };
      }

      // Check for suspicious activity
      const suspiciousActivity = await this.detectSuspiciousSubmission(
        context,
        submissionData,
      );

      if (suspiciousActivity.detected) {
        const shouldBlock = suspiciousActivity.severity === "high";

        await this.logSecurityEvent({
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          action: "submit_birthday",
          endpoint: "/api/graphql",
          result: shouldBlock ? "blocked" : "allowed",
          reason: shouldBlock
            ? "High-risk suspicious activity"
            : "Suspicious activity detected",
          metadata: {
            suspiciousActivity,
            submissionData: {
              name: submissionData.name,
              date: submissionData.date,
            },
          },
        });

        if (shouldBlock) {
          // Automatically deactivate the sharing link for high-risk activity
          await this.deactivateSuspiciousLink(
            context.token,
            suspiciousActivity.reason || "High-risk activity",
          );

          return {
            allowed: false,
            reason:
              "Suspicious activity detected. The sharing link has been deactivated for security.",
            suspiciousActivity,
          };
        }
      }

      // Log successful check
      await this.logSecurityEvent({
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: "submit_birthday",
        endpoint: "/api/graphql",
        result: "allowed",
        metadata: {
          rateLimitInfo: { ip: ipResult, link: linkResult },
          suspiciousActivity,
        },
      });

      return {
        allowed: true,
        rateLimitInfo: {
          remaining: Math.min(ipResult.remaining, linkResult.remaining),
          resetTime: new Date(
            Math.max(
              ipResult.resetTime.getTime(),
              linkResult.resetTime.getTime(),
            ),
          ),
        },
        suspiciousActivity,
      };
    } catch (error) {
      console.error("Security middleware error:", error);

      await this.logSecurityEvent({
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: "submit_birthday",
        endpoint: "/api/graphql",
        result: "blocked",
        reason: "Security check failed",
        metadata: { error: (error as Error).message },
      });

      // Fail secure - block on error
      return {
        allowed: false,
        reason: "Security check failed. Please try again.",
      };
    }
  }

  /**
   * Detect suspicious link generation patterns
   */
  private static async detectSuspiciousLinkGeneration(
    context: SecurityContext & { userId: string },
  ): Promise<{
    detected: boolean;
    reason?: string;
    severity: "low" | "medium" | "high";
  }> {
    const suspiciousReasons: string[] = [];
    let maxSeverity: "low" | "medium" | "high" = "low";

    // Check for bot-like user agents
    if (context.userAgent) {
      const isBotLike = this.SUSPICIOUS_PATTERNS.BOT_USER_AGENTS.some(
        (pattern) => pattern.test(context.userAgent!),
      );

      if (isBotLike) {
        suspiciousReasons.push("Bot-like user agent detected");
        maxSeverity = "medium";
      }
    }

    // Check for rapid link generation from same user (already handled by SharingService)
    const recentLinksFromUser = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, context.userId),
        gte(
          sharingLinks.createdAt,
          new Date(
            Date.now() -
              this.SUSPICIOUS_PATTERNS.RAPID_LINK_GENERATION.windowMs,
          ),
        ),
      ),
    });
    const recentLinksCount = recentLinksFromUser.length;

    if (
      recentLinksCount >=
      this.SUSPICIOUS_PATTERNS.RAPID_LINK_GENERATION.threshold
    ) {
      suspiciousReasons.push("Rapid link generation from user");
      maxSeverity = "high";
    }

    return {
      detected: suspiciousReasons.length > 0,
      reason: suspiciousReasons.join(", "),
      severity: maxSeverity,
    };
  }

  /**
   * Detect suspicious submission patterns
   */
  private static async detectSuspiciousSubmission(
    context: SecurityContext & { token: string },
    submissionData: { name: string; date: string; submitterEmail?: string },
  ): Promise<{
    detected: boolean;
    reason?: string;
    severity: "low" | "medium" | "high";
  }> {
    const suspiciousReasons: string[] = [];
    let maxSeverity: "low" | "medium" | "high" = "low";

    // Check for bot-like user agents
    if (context.userAgent) {
      const isBotLike = this.SUSPICIOUS_PATTERNS.BOT_USER_AGENTS.some(
        (pattern) => pattern.test(context.userAgent!),
      );

      if (isBotLike) {
        suspiciousReasons.push("Bot-like user agent");
        maxSeverity = "medium";
      }
    }

    // Use existing suspicious activity detection from RateLimitService
    const existingSuspiciousCheck =
      await RateLimitService.detectSuspiciousActivity(
        context.token,
        submissionData,
      );

    if (existingSuspiciousCheck.suspicious) {
      suspiciousReasons.push(
        existingSuspiciousCheck.reason || "Suspicious submission pattern",
      );
      maxSeverity = "high";
    }

    // Check for suspicious data patterns
    if (this.containsSuspiciousContent(submissionData.name)) {
      suspiciousReasons.push("Suspicious content in name field");
      maxSeverity = "medium";
    }

    return {
      detected: suspiciousReasons.length > 0,
      reason: suspiciousReasons.join(", "),
      severity: maxSeverity,
    };
  }

  /**
   * Check for suspicious content patterns
   */
  private static containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /script/i,
      /<[^>]*>/, // HTML tags
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Automatically deactivate a sharing link due to suspicious activity
   */
  private static async deactivateSuspiciousLink(
    token: string,
    reason: string,
  ): Promise<void> {
    try {
      const link = await db.query.sharingLinks.findFirst({
        where: eq(sharingLinks.token, token),
      });

      if (link) {
        await db
          .update(sharingLinks)
          .set({ isActive: false })
          .where(eq(sharingLinks.id, link.id));
      }

      // Log the deactivation
      await this.logSecurityEvent({
        timestamp: new Date(),
        ipAddress: "system",
        action: "deactivate_suspicious_link",
        endpoint: "security_middleware",
        result: "allowed",
        reason: `Automatic deactivation: ${reason}`,
        metadata: { token, reason },
      });
    } catch (error) {
      console.error("Failed to deactivate suspicious link:", error);
    }
  }

  /**
   * Log security events for monitoring and analysis
   */
  private static async logSecurityEvent(
    entry: SecurityLogEntry,
  ): Promise<void> {
    try {
      // In a production environment, this would typically log to:
      // - A dedicated security log file
      // - A security monitoring service (e.g., Splunk, ELK stack)
      // - A database table for security events
      // - An alerting system for high-severity events

      console.log(
        "SECURITY_EVENT:",
        JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
        }),
      );

      // For high-severity events, we might want to send alerts
      if (entry.result === "blocked" && entry.reason?.includes("suspicious")) {
        // In production, send alert to security team
        console.warn("HIGH_SEVERITY_SECURITY_EVENT:", {
          timestamp: entry.timestamp.toISOString(),
          ipAddress: entry.ipAddress,
          action: entry.action,
          reason: entry.reason,
        });
      }
    } catch (error) {
      // Never let logging errors break the security flow
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Get security statistics for monitoring
   */
  static async getSecurityStats(): Promise<{
    totalRequests: number;
    blockedRequests: number;
    suspiciousActivity: number;
    topBlockedIps: Array<{ ip: string; count: number }>;
    topBlockedReasons: Array<{ reason: string; count: number }>;
  }> {
    // This would typically query a security events database
    // For now, return placeholder data
    return {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivity: 0,
      topBlockedIps: [],
      topBlockedReasons: [],
    };
  }
}
