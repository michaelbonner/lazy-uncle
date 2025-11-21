import { createId } from "@paralleldrive/cuid2";
import { randomBytes } from "crypto";
import { and, desc, eq, gt, gte, lt, lte } from "drizzle-orm";
import type { SharingLink } from "../drizzle/schema";
import { sharingLinks } from "../drizzle/schema";
import db from "./db";

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
    const activeLinks = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, userId),
        eq(sharingLinks.isActive, true),
        gt(sharingLinks.expiresAt, new Date()),
      ),
    });
    const activeLinksCount = activeLinks.length;

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

    const todayLinks = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, userId),
        gte(sharingLinks.createdAt, today),
        lt(sharingLinks.createdAt, tomorrow),
      ),
    });
    const todayLinksCount = todayLinks.length;

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
      const existingLink = await db.query.sharingLinks.findFirst({
        where: eq(sharingLinks.token, token),
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
    const [sharingLink] = await db
      .insert(sharingLinks)
      .values({
        id: createId(),
        token,
        userId,
        description: description || null,
        expiresAt,
        isActive: true,
      })
      .returning();

    return sharingLink;
  }

  /**
   * Validate a sharing link token and check if it's active and not expired
   */
  static async validateSharingLink(
    token: string,
  ): Promise<(SharingLink & { user: any }) | null> {
    if (!token || typeof token !== "string") {
      return null;
    }

    const sharingLink = await db.query.sharingLinks.findFirst({
      where: eq(sharingLinks.token, token),
      with: {
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
    const links = await db.query.sharingLinks.findMany({
      where: eq(sharingLinks.userId, userId),
      with: {
        submissions: true,
      },
      orderBy: [desc(sharingLinks.createdAt)],
    });

    return links.map((link) => ({
      ...link,
      submissionCount: link.submissions.length,
    }));
  }

  /**
   * Get active sharing links for a user
   */
  static async getActiveSharingLinks(
    userId: string,
  ): Promise<SharingLinkWithSubmissionCount[]> {
    const links = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, userId),
        eq(sharingLinks.isActive, true),
        gt(sharingLinks.expiresAt, new Date()),
      ),
      with: {
        submissions: true,
      },
      orderBy: [desc(sharingLinks.createdAt)],
    });

    return links.map((link) => ({
      ...link,
      submissionCount: link.submissions.length,
    }));
  }

  /**
   * Revoke (deactivate) a sharing link
   */
  static async revokeSharingLink(
    linkId: string,
    userId: string,
  ): Promise<SharingLink | null> {
    const sharingLink = await db.query.sharingLinks.findFirst({
      where: and(eq(sharingLinks.id, linkId), eq(sharingLinks.userId, userId)),
    });

    if (!sharingLink) {
      return null;
    }

    const [updated] = await db
      .update(sharingLinks)
      .set({ isActive: false })
      .where(eq(sharingLinks.id, linkId))
      .returning();

    return updated;
  }

  /**
   * Deactivate a sharing link (internal method)
   */
  private static async deactivateSharingLink(linkId: string): Promise<void> {
    await db
      .update(sharingLinks)
      .set({ isActive: false })
      .where(eq(sharingLinks.id, linkId));
  }

  /**
   * Clean up expired sharing links
   */
  static async cleanupExpiredLinks(): Promise<number> {
    const links = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.isActive, true),
        lte(sharingLinks.expiresAt, new Date()),
      ),
    });

    if (links.length === 0) {
      return 0;
    }

    const ids = links.map((link) => link.id);
    let count = 0;
    for (const id of ids) {
      await db
        .update(sharingLinks)
        .set({ isActive: false })
        .where(eq(sharingLinks.id, id));
      count++;
    }

    return count;
  }

  /**
   * Get sharing link by ID (for owner verification)
   */
  static async getSharingLinkById(
    linkId: string,
    userId: string,
  ): Promise<SharingLink | null> {
    const sharingLink = await db.query.sharingLinks.findFirst({
      where: and(eq(sharingLinks.id, linkId), eq(sharingLinks.userId, userId)),
    });
    return sharingLink ?? null;
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
    const activeLinks = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, userId),
        eq(sharingLinks.isActive, true),
        gt(sharingLinks.expiresAt, new Date()),
      ),
    });
    const activeLinksCount = activeLinks.length;

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

    const dailyLinks = await db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, userId),
        gte(sharingLinks.createdAt, today),
        lt(sharingLinks.createdAt, tomorrow),
      ),
    });
    const dailyLinksCount = dailyLinks.length;

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
