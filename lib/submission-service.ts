import prisma from "./prisma";
import { SharingService } from "./sharing-service";
import { InputValidator, BirthdaySubmissionInput } from "./input-validator";
import { BirthdaySubmission, SubmissionStatus } from "@prisma/client";
import {
  notificationService,
  SubmissionNotificationData,
} from "./notification-service";

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  errors?: string[];
}

export interface DuplicateMatch {
  id: string;
  name: string;
  date: string;
  category?: string;
  similarity: number;
}

export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
}

export interface ProcessedSubmissionData {
  name: string;
  date: string;
  category?: string;
  notes?: string;
  submitterName?: string;
  submitterEmail?: string;
  relationship?: string;
}

export class SubmissionService {
  private static readonly MAX_SUBMISSIONS_PER_HOUR = 10;
  private static readonly DUPLICATE_SIMILARITY_THRESHOLD = 0.8;

  /**
   * Process and store a birthday submission
   */
  static async processSubmission(
    token: string,
    submissionData: BirthdaySubmissionInput,
  ): Promise<SubmissionResult> {
    try {
      // Validate the sharing link
      const sharingLink = await SharingService.validateSharingLink(token);
      if (!sharingLink) {
        return {
          success: false,
          errors: ["Invalid or expired sharing link"],
        };
      }

      // Validate and sanitize input data
      const validation = InputValidator.validateBirthdaySubmission({
        ...submissionData,
        token,
      });

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check rate limiting for this sharing link
      const rateLimitCheck = await this.checkSubmissionRateLimit(
        sharingLink.id,
      );
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          errors: [rateLimitCheck.reason || "Rate limit exceeded"],
        };
      }

      // Process and sanitize the data
      const processedData = this.processSubmissionData(
        validation.sanitizedData,
      );

      // Store the submission
      const submission = await prisma.birthdaySubmission.create({
        data: {
          sharingLinkId: sharingLink.id,
          name: processedData.name,
          date: processedData.date,
          category: processedData.category,
          notes: processedData.notes,
          submitterName: processedData.submitterName,
          submitterEmail: processedData.submitterEmail,
          relationship: processedData.relationship,
          status: SubmissionStatus.PENDING,
        },
      });

      // Send notification to the sharing link owner
      try {
        const notificationData: SubmissionNotificationData = {
          submissionId: submission.id,
          submitterName: processedData.submitterName,
          birthdayName: processedData.name,
          birthdayDate: processedData.date,
          relationship: processedData.relationship,
          notes: processedData.notes,
          sharingLinkDescription: sharingLink.description || undefined,
        };

        await notificationService.queueNotification(
          sharingLink.userId,
          "SUBMISSION",
          notificationData,
        );
      } catch (notificationError) {
        // Log notification error but don't fail the submission
        console.error(
          "Failed to send submission notification:",
          notificationError,
        );
      }

      return {
        success: true,
        submissionId: submission.id,
      };
    } catch (error) {
      console.error("Error processing submission:", error);
      return {
        success: false,
        errors: ["Failed to process submission. Please try again."],
      };
    }
  }

  /**
   * Check for duplicate birthdays in user's existing birthday list
   */
  static async detectDuplicates(
    userId: string,
    submissionData: ProcessedSubmissionData,
  ): Promise<DuplicateDetectionResult> {
    try {
      // Get user's existing birthdays
      const existingBirthdays = await prisma.birthday.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          date: true,
          category: true,
        },
      });

      const matches: DuplicateMatch[] = [];

      for (const birthday of existingBirthdays) {
        const similarity = this.calculateSimilarity(submissionData, birthday);

        if (similarity >= this.DUPLICATE_SIMILARITY_THRESHOLD) {
          matches.push({
            id: birthday.id,
            name: birthday.name,
            date: birthday.date,
            category: birthday.category || undefined,
            similarity,
          });
        }
      }

      return {
        hasDuplicates: matches.length > 0,
        matches: matches.sort((a, b) => b.similarity - a.similarity),
      };
    } catch (error) {
      console.error("Error detecting duplicates:", error);
      return {
        hasDuplicates: false,
        matches: [],
      };
    }
  }

  /**
   * Import a submission to user's birthday list
   */
  static async importSubmission(
    submissionId: string,
    userId: string,
  ): Promise<{ success: boolean; birthdayId?: string; errors?: string[] }> {
    try {
      // Get the submission and verify ownership
      const submission = await prisma.birthdaySubmission.findFirst({
        where: {
          id: submissionId,
          status: SubmissionStatus.PENDING,
          sharingLink: {
            userId,
          },
        },
        include: {
          sharingLink: true,
        },
      });

      if (!submission) {
        return {
          success: false,
          errors: ["Submission not found or already processed"],
        };
      }

      // Create birthday entry
      const birthday = await prisma.birthday.create({
        data: {
          userId,
          name: submission.name,
          date: submission.date,
          category: submission.category,
          notes: submission.notes,
          importSource: "sharing",
        },
      });

      // Update submission status
      await prisma.birthdaySubmission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.IMPORTED },
      });

      return {
        success: true,
        birthdayId: birthday.id,
      };
    } catch (error) {
      console.error("Error importing submission:", error);
      return {
        success: false,
        errors: ["Failed to import submission. Please try again."],
      };
    }
  }

  /**
   * Reject a submission
   */
  static async rejectSubmission(
    submissionId: string,
    userId: string,
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Verify ownership and update status
      const result = await prisma.birthdaySubmission.updateMany({
        where: {
          id: submissionId,
          status: SubmissionStatus.PENDING,
          sharingLink: {
            userId,
          },
        },
        data: {
          status: SubmissionStatus.REJECTED,
        },
      });

      if (result.count === 0) {
        return {
          success: false,
          errors: ["Submission not found or already processed"],
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error rejecting submission:", error);
      return {
        success: false,
        errors: ["Failed to reject submission. Please try again."],
      };
    }
  }

  /**
   * Get pending submissions for a user
   */
  static async getPendingSubmissions(
    userId: string,
  ): Promise<BirthdaySubmission[]> {
    try {
      return await prisma.birthdaySubmission.findMany({
        where: {
          status: SubmissionStatus.PENDING,
          sharingLink: {
            userId,
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
    } catch (error) {
      console.error("Error getting pending submissions:", error);
      return [];
    }
  }

  /**
   * Bulk import multiple submissions
   */
  static async bulkImportSubmissions(
    submissionIds: string[],
    userId: string,
  ): Promise<{
    success: boolean;
    imported: number;
    failed: string[];
    errors?: string[];
  }> {
    const results = {
      success: true,
      imported: 0,
      failed: [] as string[],
      errors: [] as string[],
    };

    for (const submissionId of submissionIds) {
      const result = await this.importSubmission(submissionId, userId);
      if (result.success) {
        results.imported++;
      } else {
        results.failed.push(submissionId);
        if (result.errors) {
          results.errors.push(...result.errors);
        }
      }
    }

    results.success = results.failed.length === 0;
    return results;
  }

  /**
   * Bulk reject multiple submissions
   */
  static async bulkRejectSubmissions(
    submissionIds: string[],
    userId: string,
  ): Promise<{
    success: boolean;
    rejected: number;
    failed: string[];
    errors?: string[];
  }> {
    const results = {
      success: true,
      rejected: 0,
      failed: [] as string[],
      errors: [] as string[],
    };

    for (const submissionId of submissionIds) {
      const result = await this.rejectSubmission(submissionId, userId);
      if (result.success) {
        results.rejected++;
      } else {
        results.failed.push(submissionId);
        if (result.errors) {
          results.errors.push(...result.errors);
        }
      }
    }

    results.success = results.failed.length === 0;
    return results;
  }

  /**
   * Check rate limiting for submissions on a sharing link
   */
  private static async checkSubmissionRateLimit(
    sharingLinkId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentSubmissions = await prisma.birthdaySubmission.count({
        where: {
          sharingLinkId,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (recentSubmissions >= this.MAX_SUBMISSIONS_PER_HOUR) {
        return {
          allowed: false,
          reason:
            "Too many submissions in the last hour. Please try again later.",
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // Allow submission if rate limit check fails
      return { allowed: true };
    }
  }

  /**
   * Process and sanitize submission data
   */
  private static processSubmissionData(
    sanitizedData: any,
  ): ProcessedSubmissionData {
    return {
      name: sanitizedData.name,
      date: sanitizedData.date,
      category: sanitizedData.category || undefined,
      notes: sanitizedData.notes || undefined,
      submitterName: sanitizedData.submitterName || undefined,
      submitterEmail: sanitizedData.submitterEmail || undefined,
      relationship: sanitizedData.relationship || undefined,
    };
  }

  /**
   * Calculate similarity between submission and existing birthday
   */
  private static calculateSimilarity(
    submission: ProcessedSubmissionData,
    existing: { name: string; date: string; category?: string | null },
  ): number {
    let similarity = 0;
    let factors = 0;

    // Name similarity (most important factor)
    const nameSimilarity = this.calculateStringSimilarity(
      submission.name.toLowerCase(),
      existing.name.toLowerCase(),
    );
    similarity += nameSimilarity * 0.6;
    factors += 0.6;

    // Date similarity (exact match or close)
    if (submission.date === existing.date) {
      similarity += 0.4;
    } else {
      // Check if it's the same day/month but different year
      const submissionParts = submission.date.split("-");
      const existingParts = existing.date.split("-");

      if (
        submissionParts[1] === existingParts[1] && // Same month
        submissionParts[2] === existingParts[2] // Same day
      ) {
        similarity += 0.2; // Partial credit for same day/month
      }
    }
    factors += 0.4;

    return similarity / factors;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Clean up old rejected submissions (for maintenance)
   */
  static async cleanupOldRejectedSubmissions(
    daysOld: number = 30,
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.birthdaySubmission.deleteMany({
        where: {
          status: SubmissionStatus.REJECTED,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error("Error cleaning up old rejected submissions:", error);
      return 0;
    }
  }
}
