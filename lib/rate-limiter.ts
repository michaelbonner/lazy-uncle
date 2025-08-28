import prisma from "./prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  // eslint-disable-next-line no-unused-vars
  keyGenerator: (identifier: string) => string; // Function to generate cache key
}

/**
 * Simple in-memory rate limiter for submission endpoints
 * In production, this should be replaced with Redis or similar
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: Date }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup(): void {
    const now = new Date();
    const entries = Array.from(this.requests.entries());
    for (const [key, data] of entries) {
      if (data.resetTime <= now) {
        this.requests.delete(key);
      }
    }
  }

  async checkLimit(
    identifier: string,
    options: RateLimitOptions,
  ): Promise<RateLimitResult> {
    const key = options.keyGenerator(identifier);
    const now = new Date();

    let requestData = this.requests.get(key);

    // If no data exists or window has expired, create new entry
    if (!requestData || requestData.resetTime <= now) {
      requestData = {
        count: 1,
        resetTime: new Date(now.getTime() + options.windowMs),
      };
      this.requests.set(key, requestData);

      return {
        allowed: true,
        remaining: options.maxRequests - 1,
        resetTime: requestData.resetTime,
      };
    }

    // Increment count
    requestData.count++;

    // Check if limit exceeded
    if (requestData.count > options.maxRequests) {
      const retryAfter = Math.ceil(
        (requestData.resetTime.getTime() - now.getTime()) / 1000,
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: requestData.resetTime,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: options.maxRequests - requestData.count,
      resetTime: requestData.resetTime,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter();

export class RateLimitService {
  /**
   * Rate limit for birthday submissions by IP address
   * 10 submissions per hour per IP
   */
  static async checkSubmissionRateLimit(
    ipAddress: string,
  ): Promise<RateLimitResult> {
    return rateLimiter.checkLimit(ipAddress, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      keyGenerator: (ip) => `submission:${ip}`,
    });
  }

  /**
   * Rate limit for birthday submissions by sharing link token
   * 50 submissions per hour per link to prevent abuse
   */
  static async checkLinkSubmissionRateLimit(
    token: string,
  ): Promise<RateLimitResult> {
    return rateLimiter.checkLimit(token, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      keyGenerator: (token) => `link:${token}`,
    });
  }

  /**
   * Persistent rate limiting using database for more serious violations
   * Track submissions per IP in database for longer-term blocking
   */
  static async checkPersistentRateLimit(
    ipAddress: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count submissions from this IP in the last hour
    const hourlyCount = await prisma.birthdaySubmission.count({
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
        // We'll need to add IP tracking to the schema, for now use submitterEmail as proxy
        submitterEmail: {
          contains: ipAddress, // This is a placeholder - in real implementation we'd track IP
        },
      },
    });

    // Count submissions from this IP in the last day
    const dailyCount = await prisma.birthdaySubmission.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
        submitterEmail: {
          contains: ipAddress, // This is a placeholder
        },
      },
    });

    // Block if too many submissions in short time
    if (hourlyCount > 20) {
      return {
        allowed: false,
        reason:
          "Too many submissions from this IP address. Please try again later.",
      };
    }

    if (dailyCount > 100) {
      return {
        allowed: false,
        reason: "Daily submission limit exceeded for this IP address.",
      };
    }

    return { allowed: true };
  }

  /**
   * Check for suspicious patterns that might indicate abuse
   */
  static async detectSuspiciousActivity(
    token: string,
    submissionData: {
      name: string;
      date: string;
      submitterEmail?: string;
    },
  ): Promise<{ suspicious: boolean; reason?: string }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check for duplicate submissions with same data
    const duplicateCount = await prisma.birthdaySubmission.count({
      where: {
        sharingLink: {
          token,
        },
        name: submissionData.name,
        date: submissionData.date,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (duplicateCount > 0) {
      return {
        suspicious: true,
        reason: "Duplicate submission detected",
      };
    }

    // Check for too many submissions from same email
    if (submissionData.submitterEmail) {
      const emailCount = await prisma.birthdaySubmission.count({
        where: {
          submitterEmail: submissionData.submitterEmail,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (emailCount > 5) {
        return {
          suspicious: true,
          reason: "Too many submissions from same email address",
        };
      }
    }

    return { suspicious: false };
  }
}

// Cleanup on process exit
process.on("SIGTERM", () => {
  rateLimiter.destroy();
});

process.on("SIGINT", () => {
  rateLimiter.destroy();
});
