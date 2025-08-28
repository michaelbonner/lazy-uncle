import nodemailer from "nodemailer";
import prisma from "./prisma";

export interface NotificationPreferences {
  emailNotifications: boolean;
  summaryNotifications: boolean;
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
  data: any;
  createdAt: Date;
  processed: boolean;
}

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    // For development, we'll use a test account or console logging
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
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
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      return {
        emailNotifications: preferences?.emailNotifications ?? true,
        summaryNotifications: preferences?.summaryNotifications ?? false,
      };
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      // Return default preferences on error
      return {
        emailNotifications: true,
        summaryNotifications: false,
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
      await prisma.notificationPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          emailNotifications: preferences.emailNotifications ?? true,
          summaryNotifications: preferences.summaryNotifications ?? false,
        },
      });
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
   * Send email using configured transporter
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      // In development, log to console instead of sending real emails
      if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
        console.log("=== EMAIL NOTIFICATION ===");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log("Text Content:");
        console.log(options.text);
        console.log("========================");
        return;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@lazyuncle.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
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
    data: any,
  ): Promise<void> {
    // For now, we'll process notifications immediately
    // In a production environment, you might want to use a proper queue system
    try {
      if (type === "SUBMISSION") {
        await this.sendSubmissionNotification(userId, data);
      } else if (type === "SUMMARY") {
        await this.sendSummaryNotification(userId, data);
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
}

// Export singleton instance
export const notificationService = new NotificationService();
