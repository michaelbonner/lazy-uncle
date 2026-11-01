import {
  users,
  notificationPreferences,
  birthdays,
  sharingLinks,
  birthdaySubmissions,
} from "../drizzle/schema";
import db from "./db";
import {
  birthdayReminderEmail,
  submissionEmail,
  summaryEmail,
} from "./email-templates";
import { buildUnsubscribeUrl } from "./unsubscribe-token";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface NotificationPreferences {
  emailNotifications: boolean;
  summaryNotifications: boolean;
  birthdayReminders: boolean;
}

export interface SubmissionNotificationData {
  submissionId: string;
  submitterName?: string;
  birthdayName: string;
  birthdayDate: string;
  relationship?: string;
  notes?: string;
  sharingLinkDescription?: string;
}

export interface NotificationQueue {
  id: string;
  userId: string;
  type: "SUBMISSION" | "SUMMARY";
  data: SubmissionNotificationData | SubmissionNotificationData[];
  createdAt: Date;
  processed: boolean;
}

export class NotificationService {
  private resend: Resend | null;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    this.resend = key ? new Resend(key) : null;
  }

  /**
   * Send notification for a new birthday submission
   */
  async sendSubmissionNotification(
    userId: string,
    submissionData: SubmissionNotificationData,
  ): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getUserNotificationPreferences(userId);

      if (!preferences.emailNotifications) {
        console.log(`Notifications disabled for user ${userId}`);
        return;
      }

      // Get user email
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, name: true },
      });

      if (!user?.email) {
        console.error(`No email found for user ${userId}`);
        return;
      }

      // Generate email content
      const emailContent = this.generateSubmissionEmailContent(
        submissionData,
        user.name,
        userId,
      );

      // Send email
      await this.sendEmail({
        to: user.email,
        subject: "A birthday to review on Lazy Uncle",
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Submission notification sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send submission notification:", error);
      throw error;
    }
  }

  /**
   * Send summary notification for multiple submissions
   */
  async sendSummaryNotification(
    userId: string,
    submissions: SubmissionNotificationData[],
  ): Promise<void> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId);

      if (
        !preferences.emailNotifications ||
        !preferences.summaryNotifications
      ) {
        return;
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, name: true },
      });

      if (!user?.email) {
        console.error(`No email found for user ${userId}`);
        return;
      }

      const emailContent = this.generateSummaryEmailContent(
        submissions,
        user.name,
        userId,
      );

      await this.sendEmail({
        to: user.email,
        subject: `${submissions.length} birthday submissions to review on Lazy Uncle`,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Summary notification sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send summary notification:", error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    try {
      const preferences = await db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, userId),
      });

      return {
        emailNotifications: preferences?.emailNotifications ?? true,
        summaryNotifications: preferences?.summaryNotifications ?? false,
        birthdayReminders: preferences?.birthdayReminders ?? false,
      };
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      // Return default preferences on error
      return {
        emailNotifications: true,
        summaryNotifications: false,
        birthdayReminders: false,
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<void> {
    try {
      // Check if preferences exist
      const existing = await db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, userId),
      });

      if (existing) {
        // Update existing preferences
        await db
          .update(notificationPreferences)
          .set(preferences)
          .where(eq(notificationPreferences.userId, userId));
      } else {
        // Create new preferences
        await db.insert(notificationPreferences).values({
          id: createId(),
          userId,
          emailNotifications: preferences.emailNotifications ?? true,
          summaryNotifications: preferences.summaryNotifications ?? false,
          birthdayReminders: preferences.birthdayReminders ?? false,
        });
      }
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      throw error;
    }
  }

  /**
   * Generate email content for submission notification
   */
  private generateSubmissionEmailContent(
    submission: SubmissionNotificationData,
    userName: string | null | undefined,
    userId: string,
  ): { html: string; text: string } {
    return submissionEmail({
      submission,
      userName,
      unsubscribeUrl: buildUnsubscribeUrl(userId, "submission"),
    });
  }

  /**
   * Generate email content for summary notification
   */
  private generateSummaryEmailContent(
    submissions: SubmissionNotificationData[],
    userName: string | null | undefined,
    userId: string,
  ): { html: string; text: string } {
    return summaryEmail({
      submissions,
      userName,
      unsubscribeUrl: buildUnsubscribeUrl(userId, "summary"),
    });
  }

  /**
   * Send email via SMTP (e.g. Mailpit in development)
   */
  private async sendEmailViaSMTP(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "1025", 10),
      secure: false,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ?? "",
          }
        : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Lazy Uncle <noreply@lazyuncle.net>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`Email sent via SMTP to ${options.to}`);
  }

  /**
   * Send email using Resend or SMTP depending on environment
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      if (process.env.SMTP_HOST) {
        await this.sendEmailViaSMTP(options);
        return;
      }

      // In development without SMTP, log to console
      if (process.env.NODE_ENV === "development") {
        console.log("=== EMAIL NOTIFICATION ===");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log("Text Content:");
        console.log(options.text);
        console.log("========================");
        return;
      }

      if (!this.resend) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            "RESEND_API_KEY (or SMTP_HOST) is required to send email in production",
          );
        }
        console.warn("Resend client not initialized; skipping email send.");
        return;
      }

      const { data, error } = await this.resend.emails.send({
        from: "Lazy Uncle <noreply@updates.lazyuncle.net>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        throw error;
      }

      console.log("Email sent successfully:", data);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  /**
   * Add notification to processing queue
   */
  async queueNotification(
    userId: string,
    type: "SUBMISSION" | "SUMMARY",
    data: SubmissionNotificationData | SubmissionNotificationData[],
  ): Promise<void> {
    // For now, we'll process notifications immediately
    // In a production environment, you might want to use a proper queue system
    try {
      if (type === "SUBMISSION") {
        await this.sendSubmissionNotification(
          userId,
          data as SubmissionNotificationData,
        );
      } else if (type === "SUMMARY") {
        await this.sendSummaryNotification(
          userId,
          data as SubmissionNotificationData[],
        );
      }
    } catch (error) {
      console.error("Failed to process notification:", error);
      // In a real queue system, you'd mark the job as failed and potentially retry
    }
  }

  /**
   * Process pending notifications (for background job)
   */
  async processPendingNotifications(): Promise<void> {
    // This would be implemented with a proper queue system in production
    // For now, notifications are processed immediately when queued
    console.log("Processing pending notifications...");
  }

  /**
   * Send birthday reminder emails for birthdays occurring today
   */
  async processUpcomingBirthdayReminders(): Promise<void> {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    console.log(
      `Processing birthday reminders for ${todayMonth}/${todayDay}...`,
    );

    // Find users with birthdayReminders enabled
    const prefs = await db.query.notificationPreferences.findMany({
      where: eq(notificationPreferences.birthdayReminders, true),
    });

    for (const pref of prefs) {
      const todaysBirthdays = await db.query.birthdays.findMany({
        where: and(
          eq(birthdays.userId, pref.userId),
          eq(birthdays.month, todayMonth),
          eq(birthdays.day, todayDay),
          eq(birthdays.remindersEnabled, true),
        ),
      });

      if (todaysBirthdays.length === 0) continue;

      const user = await db.query.users.findFirst({
        where: eq(users.id, pref.userId),
        columns: { email: true, name: true },
      });

      if (!user?.email) continue;

      try {
        await this.sendBirthdayReminderEmail(
          pref.userId,
          user,
          todaysBirthdays,
        );
      } catch (error) {
        console.error(
          `Failed to send birthday reminder for user ${pref.userId}:`,
          error,
        );
      }
    }
  }

  /**
   * Send daily summary emails for users who have pending submissions
   */
  async processDailySummaryNotifications(): Promise<void> {
    console.log("Processing daily summary notifications...");

    // Find users with summary notifications enabled
    const prefs = await db.query.notificationPreferences.findMany({
      where: and(
        eq(notificationPreferences.emailNotifications, true),
        eq(notificationPreferences.summaryNotifications, true),
      ),
    });

    for (const pref of prefs) {
      const userLinks = await db.query.sharingLinks.findMany({
        where: eq(sharingLinks.userId, pref.userId),
        with: {
          submissions: {
            where: eq(birthdaySubmissions.status, "PENDING"),
          },
        },
      });

      const pendingSubmissions = userLinks.flatMap((link) =>
        link.submissions.map((sub) => ({
          submissionId: sub.id,
          birthdayName: sub.name,
          birthdayDate:
            sub.date ??
            `${sub.month}/${sub.day}${sub.year ? `/${sub.year}` : ""}`,
          submitterName: sub.submitterName ?? undefined,
          relationship: sub.relationship ?? undefined,
          notes: sub.notes ?? undefined,
          sharingLinkDescription: link.description ?? undefined,
        })),
      );

      if (pendingSubmissions.length === 0) continue;

      try {
        await this.sendSummaryNotification(pref.userId, pendingSubmissions);
      } catch (error) {
        console.error(
          `Failed to send summary notification for user ${pref.userId}:`,
          error,
        );
      }
    }

    console.log(
      `Processed daily summary notifications for ${prefs.length} eligible users`,
    );
  }

  /**
   * Send a birthday reminder email to a user
   */
  private async sendBirthdayReminderEmail(
    userId: string,
    user: { email: string; name: string | null },
    todaysBirthdays: Array<{
      name: string;
      year: number | null;
      month: number;
      day: number;
    }>,
  ): Promise<void> {
    const count = todaysBirthdays.length;
    const isSingle = count === 1;
    const content = birthdayReminderEmail({
      birthdays: todaysBirthdays,
      userName: user.name,
      unsubscribeUrl: buildUnsubscribeUrl(userId, "reminder"),
      currentYear: new Date().getFullYear(),
    });

    await this.sendEmail({
      to: user.email,
      subject: isSingle
        ? `${todaysBirthdays[0].name}'s birthday is today | Lazy Uncle`
        : `${count} birthdays today | Lazy Uncle`,
      ...content,
    });

    console.log(
      `Birthday reminder sent to ${user.email} for ${count} birthday(s)`,
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
