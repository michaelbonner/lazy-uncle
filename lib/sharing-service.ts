import { randomBytes } from "crypto";
import prisma from "./prisma";
import { SharingLink } from "@prisma/client";

export interface CreateSharingLinkOptions {
  userId: string;
  description?: string;
  expirationHours?: number;
}

export interface SharingLinkWithSubmissionCount extends SharingLink {
  submissionCount: number;
}

export class SharingService {
  private static readonly DEFAULT_EXPIRATION_HOURS = 168; // 7 days
  private static readonly TOKEN_LENGTH = 32;
  private static readonly MAX_ACTIVE_LINKS_PER_USER = 5;
  private static readonly DAILY_GENERATION_LIMIT = 3;

  /**
   * Generate a cryptographically secure random token for sharing links
   */
  private static generateSecureToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString("base64url");
  }

  /**
   * Create a new sharing link for a user
   */
  static async createSharingLink(
    options: CreateSharingLinkOptions,
  ): Promise<SharingLink> {
    const {
      userId,
      description,
      expirationHours = this.DEFAULT_EXPIRATION_HOURS,
    } = options;

    // Check rate limiting - max active links per user
    const activeLinksCount = await prisma.sharingLink.count({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (activeLinksCount >= this.MAX_ACTIVE_LINKS_PER_USER) {
      throw new Error(
        `Maximum of ${this.MAX_ACTIVE_LINKS_PER_USER} active sharing links allowed per user`,
      );
    }

    // Check daily generation limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLinksCount = await prisma.sharingLink.count({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (todayLinksCount >= this.DAILY_GENERATION_LIMIT) {
      throw new Error(
        `Daily limit of ${this.DAILY_GENERATION_LIMIT} sharing links exceeded`,
      );
    }

    // Generate unique token
    let token: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      token = this.generateSecureToken();
      const existingLink = await prisma.sharingLink.findUnique({
        where: { token },
      });
      isUnique = !existingLink;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      throw new Error(
        "Failed to generate unique token after multiple attempts",
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Create the sharing link
    const sharingLink = await prisma.sharingLink.create({
      data: {
        token,
        userId,
        description,
        expiresAt,
        isActive: true,
      },
    });

    return sharingLink;
  }

  /**
   * Validate a sharing link token and check if it's active and not expired
   */
  static async validateSharingLink(token: string): Promise<SharingLink | null> {
    if (!token || typeof token !== "string") {
      return null;
    }

    const sharingLink = await prisma.sharingLink.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!sharingLink) {
      return null;
    }

    // Check if link is active
    if (!sharingLink.isActive) {
      return null;
    }

    // Check if link has expired
    if (sharingLink.expiresAt <= new Date()) {
      // Automatically deactivate expired links
      await this.deactivateSharingLink(sharingLink.id);
      return null;
    }

    return sharingLink;
  }

  /**
   * Get all sharing links for a user with submission counts
   */
  static async getUserSharingLinks(
    userId: string,
  ): Promise<SharingLinkWithSubmissionCount[]> {
    const sharingLinks = await prisma.sharingLink.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sharingLinks.map((link) => ({
      ...link,
      submissionCount: link._count.submissions,
    }));
  }

  /**
   * Get active sharing links for a user
   */
  static async getActiveSharingLinks(
    userId: string,
  ): Promise<SharingLinkWithSubmissionCount[]> {
    const sharingLinks = await prisma.sharingLink.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sharingLinks.map((link) => ({
      ...link,
      submissionCount: link._count.submissions,
    }));
  }

  /**
   * Revoke (deactivate) a sharing link
   */
  static async revokeSharingLink(
    linkId: string,
    userId: string,
  ): Promise<SharingLink | null> {
    const sharingLink = await prisma.sharingLink.findFirst({
      where: {
        id: linkId,
        userId, // Ensure user can only revoke their own links
      },
    });

    if (!sharingLink) {
      return null;
    }

    return await prisma.sharingLink.update({
      where: {
        id: linkId,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Deactivate a sharing link (internal method)
   */
  private static async deactivateSharingLink(linkId: string): Promise<void> {
    await prisma.sharingLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });
  }

  /**
   * Clean up expired sharing links
   */
  static async cleanupExpiredLinks(): Promise<number> {
    const result = await prisma.sharingLink.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  /**
   * Get sharing link by ID (for owner verification)
   */
  static async getSharingLinkById(
    linkId: string,
    userId: string,
  ): Promise<SharingLink | null> {
    return await prisma.sharingLink.findFirst({
      where: {
        id: linkId,
        userId,
      },
    });
  }

  /**
   * Check if user can create more sharing links (rate limiting check)
   */
  static async canCreateSharingLink(userId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    activeLinksCount: number;
    dailyLinksCount: number;
  }> {
    // Check active links limit
    const activeLinksCount = await prisma.sharingLink.count({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (activeLinksCount >= this.MAX_ACTIVE_LINKS_PER_USER) {
      return {
        canCreate: false,
        reason: `Maximum of ${this.MAX_ACTIVE_LINKS_PER_USER} active sharing links allowed`,
        activeLinksCount,
        dailyLinksCount: 0,
      };
    }

    // Check daily generation limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyLinksCount = await prisma.sharingLink.count({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (dailyLinksCount >= this.DAILY_GENERATION_LIMIT) {
      return {
        canCreate: false,
        reason: `Daily limit of ${this.DAILY_GENERATION_LIMIT} sharing links exceeded`,
        activeLinksCount,
        dailyLinksCount,
      };
    }

    return {
      canCreate: true,
      activeLinksCount,
      dailyLinksCount,
    };
  }
}
