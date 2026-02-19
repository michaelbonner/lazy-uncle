import { users, notificationPreferences, birthdays } from "../drizzle/schema";
import db from "./db";
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
  private resend: Resend;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("RESEND_API_KEY is required in production");
      }
      console.warn("RESEND_API_KEY not set; emails will be logged only.");
    }
    this.resend = new Resend(key ?? "re_123");
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
      );

      // Send email
      await this.sendEmail({
        to: user.email,
        subject: "New Birthday Submission Received",
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
      );

      await this.sendEmail({
        to: user.email,
        subject: `${submissions.length} New Birthday Submissions`,
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
    userName?: string | null,
  ): { html: string; text: string } {
    const greeting = userName ? `Hi ${userName}` : "Hello";
    const submitterInfo = submission.submitterName
      ? `from ${submission.submitterName}`
      : "from someone";

    const relationshipInfo = submission.relationship
      ? ` (${submission.relationship})`
      : "";

    const linkInfo = submission.sharingLinkDescription
      ? ` via your "${submission.sharingLinkDescription}" sharing link`
      : "";

    const notesSection = submission.notes
      ? `\n\nNotes: ${submission.notes}`
      : "";

    const text = `${greeting},

You've received a new birthday submission ${submitterInfo}${linkInfo}!

Birthday Details:
- Name: ${submission.birthdayName}${relationshipInfo}
- Date: ${submission.birthdayDate}${notesSection}

You can review and import this birthday by visiting your Lazy Uncle dashboard.

Best regards,
The Lazy Uncle Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Birthday Submission</h2>
        
        <p>${greeting},</p>
        
        <p>You've received a new birthday submission ${submitterInfo}${linkInfo}!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">Birthday Details</h3>
          <p><strong>Name:</strong> ${submission.birthdayName}${relationshipInfo}</p>
          <p><strong>Date:</strong> ${submission.birthdayDate}</p>
          ${submission.notes ? `<p><strong>Notes:</strong> ${submission.notes}</p>` : ""}
        </div>
        
        <p>You can review and import this birthday by visiting your Lazy Uncle dashboard.</p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The Lazy Uncle Team
        </p>
      </div>
    `;

    return { html, text };
  }

  /**
   * Generate email content for summary notification
   */
  private generateSummaryEmailContent(
    submissions: SubmissionNotificationData[],
    userName?: string | null,
  ): { html: string; text: string } {
    const greeting = userName ? `Hi ${userName}` : "Hello";
    const count = submissions.length;

    const text = `${greeting},

You have ${count} new birthday submissions waiting for review!

${submissions
  .map(
    (sub, index) =>
      `${index + 1}. ${sub.birthdayName} (${sub.birthdayDate})${sub.submitterName ? ` from ${sub.submitterName}` : ""}`,
  )
  .join("\n")}

You can review and import these birthdays by visiting your Lazy Uncle dashboard.

Best regards,
The Lazy Uncle Team`;

    const submissionsList = submissions
      .map(
        (sub) =>
          `<li>${sub.birthdayName} (${sub.birthdayDate})${sub.submitterName ? ` from ${sub.submitterName}` : ""}</li>`,
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${count} New Birthday Submissions</h2>
        
        <p>${greeting},</p>
        
        <p>You have ${count} new birthday submissions waiting for review!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">Submissions</h3>
          <ol style="margin: 0; padding-left: 20px;">
            ${submissionsList}
          </ol>
        </div>
        
        <p>You can review and import these birthdays by visiting your Lazy Uncle dashboard.</p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The Lazy Uncle Team
        </p>
      </div>
    `;

    return { html, text };
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
      auth:
        process.env.SMTP_USER
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
  private async sendEmail(options: {
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
        await this.sendBirthdayReminderEmail(user, todaysBirthdays);
      } catch (error) {
        console.error(
          `Failed to send birthday reminder for user ${pref.userId}:`,
          error,
        );
      }
    }
  }

  /**
   * Send a birthday reminder email to a user
   */
  private async sendBirthdayReminderEmail(
    user: { email: string; name: string | null },
    todaysBirthdays: Array<{
      name: string;
      year: number | null;
      month: number;
      day: number;
    }>,
  ): Promise<void> {
    const greeting = user.name ? `Hi ${user.name}` : "Hello";
    const count = todaysBirthdays.length;
    const isSingle = count === 1;

    const birthdayLines = todaysBirthdays.map((b) => {
      const age =
        b.year != null ? ` (turns ${new Date().getFullYear() - b.year})` : "";
      return `${b.name}${age}`;
    });

    const text = `${greeting},

${isSingle ? `It's ${birthdayLines[0]}'s birthday today!` : `It's a big day — ${count} birthdays today!`}

${isSingle ? "" : birthdayLines.map((l, i) => `${i + 1}. ${l}`).join("\n") + "\n"}
Don't forget to wish them a happy birthday!

Best regards,
The Lazy Uncle Team`;

    const listHtml = isSingle
      ? `<p><strong>${birthdayLines[0]}</strong></p>`
      : `<ol style="margin: 0; padding-left: 20px;">${todaysBirthdays
          .map((b) => {
            const age =
              b.year != null
                ? ` (turns ${new Date().getFullYear() - b.year})`
                : "";
            return `<li><strong>${b.name}</strong>${age}</li>`;
          })
          .join("")}</ol>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎂 Birthday Reminder</h2>
        <p>${greeting},</p>
        <p>${isSingle ? `It's <strong>${birthdayLines[0]}</strong>'s birthday today!` : `It's a big day — <strong>${count} birthdays</strong> today!`}</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${listHtml}
        </div>
        <p>Don't forget to wish them a happy birthday!</p>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The Lazy Uncle Team
        </p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject:
        isSingle
          ? `🎂 It's ${todaysBirthdays[0].name}'s birthday today!`
          : `🎂 ${count} birthdays today!`,
      html,
      text,
    });

    console.log(
      `Birthday reminder sent to ${user.email} for ${count} birthday(s)`,
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
