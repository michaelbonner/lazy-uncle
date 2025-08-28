import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock prisma
vi.mock("./prisma", () => ({
  default: {
    notificationPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
    })),
  },
}));

import {
  NotificationService,
  SubmissionNotificationData,
} from "./notification-service";
import prisma from "./prisma";

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let consoleSpy: any;

  beforeEach(() => {
    notificationService = new NotificationService();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe("getUserNotificationPreferences", () => {
    it("should return user preferences when they exist", async () => {
      const mockPreferences = {
        emailNotifications: true,
        summaryNotifications: false,
      };

      (prisma.notificationPreference.findUnique as any).mockResolvedValue(
        mockPreferences,
      );

      const result =
        await notificationService.getUserNotificationPreferences("user123");

      expect(result).toEqual(mockPreferences);
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: "user123" },
      });
    });

    it("should return default preferences when none exist", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue(null);

      const result =
        await notificationService.getUserNotificationPreferences("user123");

      expect(result).toEqual({
        emailNotifications: true,
        summaryNotifications: false,
      });
    });

    it("should return default preferences on database error", async () => {
      (prisma.notificationPreference.findUnique as any).mockRejectedValue(
        new Error("DB Error"),
      );

      const result =
        await notificationService.getUserNotificationPreferences("user123");

      expect(result).toEqual({
        emailNotifications: true,
        summaryNotifications: false,
      });
    });
  });

  describe("updateNotificationPreferences", () => {
    it("should update existing preferences", async () => {
      const preferences = {
        emailNotifications: false,
        summaryNotifications: true,
      };

      (prisma.notificationPreference.upsert as any).mockResolvedValue({});

      await notificationService.updateNotificationPreferences(
        "user123",
        preferences,
      );

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: "user123" },
        update: preferences,
        create: {
          userId: "user123",
          emailNotifications: false,
          summaryNotifications: true,
        },
      });
    });

    it("should create preferences with defaults for missing values", async () => {
      const preferences = { emailNotifications: false };

      (prisma.notificationPreference.upsert as any).mockResolvedValue({});

      await notificationService.updateNotificationPreferences(
        "user123",
        preferences,
      );

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: "user123" },
        update: preferences,
        create: {
          userId: "user123",
          emailNotifications: false,
          summaryNotifications: false,
        },
      });
    });

    it("should throw error on database failure", async () => {
      (prisma.notificationPreference.upsert as any).mockRejectedValue(
        new Error("DB Error"),
      );

      await expect(
        notificationService.updateNotificationPreferences("user123", {}),
      ).rejects.toThrow("DB Error");
    });
  });

  describe("sendSubmissionNotification", () => {
    const mockSubmissionData: SubmissionNotificationData = {
      submissionId: "sub123",
      submitterName: "John Doe",
      birthdayName: "Jane Smith",
      birthdayDate: "1990-05-15",
      relationship: "Friend",
      notes: "Met at college",
      sharingLinkDescription: "Family & Friends",
    };

    beforeEach(() => {
      // Mock environment to development mode
      process.env.NODE_ENV = "development";
    });

    it("should send notification when preferences allow", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      await notificationService.sendSubmissionNotification(
        "user123",
        mockSubmissionData,
      );

      expect(consoleSpy).toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
      expect(consoleSpy).toHaveBeenCalledWith("To: user@example.com");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Subject: New Birthday Submission Received",
      );
    });

    it("should not send notification when email notifications are disabled", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: false,
        summaryNotifications: false,
      });

      await notificationService.sendSubmissionNotification(
        "user123",
        mockSubmissionData,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Notifications disabled for user user123",
      );
    });

    it("should handle missing user email gracefully", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
      });

      (prisma.user.findUnique as any).mockResolvedValue(null);

      await notificationService.sendSubmissionNotification(
        "user123",
        mockSubmissionData,
      );

      expect(console.error).toHaveBeenCalledWith(
        "No email found for user user123",
      );
    });

    it("should generate correct email content with all fields", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      await notificationService.sendSubmissionNotification(
        "user123",
        mockSubmissionData,
      );

      // Check that the console output contains expected content
      const logCalls = consoleSpy.mock.calls;
      const textContent = logCalls.find(
        (call) =>
          call[0] && call[0].includes && call[0].includes("Hi Test User"),
      );

      expect(textContent).toBeTruthy();
    });

    it("should generate correct email content with minimal fields", async () => {
      const minimalData: SubmissionNotificationData = {
        submissionId: "sub123",
        birthdayName: "Jane Smith",
        birthdayDate: "1990-05-15",
      };

      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: null,
      });

      await notificationService.sendSubmissionNotification(
        "user123",
        minimalData,
      );

      const logCalls = consoleSpy.mock.calls;
      const textContent = logCalls.find(
        (call) => call[0] && call[0].includes && call[0].includes("Hello,"),
      );

      expect(textContent).toBeTruthy();
    });
  });

  describe("sendSummaryNotification", () => {
    const mockSubmissions: SubmissionNotificationData[] = [
      {
        submissionId: "sub1",
        submitterName: "John Doe",
        birthdayName: "Jane Smith",
        birthdayDate: "1990-05-15",
      },
      {
        submissionId: "sub2",
        submitterName: "Alice Johnson",
        birthdayName: "Bob Wilson",
        birthdayDate: "1985-12-03",
      },
    ];

    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should send summary notification when preferences allow", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: true,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      expect(consoleSpy).toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
      expect(consoleSpy).toHaveBeenCalledWith("To: user@example.com");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Subject: 2 New Birthday Submissions",
      );
    });

    it("should not send when email notifications are disabled", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: false,
        summaryNotifications: true,
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      expect(consoleSpy).not.toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
    });

    it("should not send when summary notifications are disabled", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      expect(consoleSpy).not.toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
    });

    it("should include all submissions in the summary", async () => {
      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: true,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      const logCalls = consoleSpy.mock.calls;
      const textContent = logCalls.find(
        (call) =>
          call[0] &&
          call[0].includes &&
          call[0].includes("Jane Smith") &&
          call[0].includes("Bob Wilson"),
      );

      expect(textContent).toBeTruthy();
    });
  });

  describe("queueNotification", () => {
    it("should process submission notification immediately", async () => {
      const mockData: SubmissionNotificationData = {
        submissionId: "sub123",
        birthdayName: "Jane Smith",
        birthdayDate: "1990-05-15",
      };

      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      await notificationService.queueNotification(
        "user123",
        "SUBMISSION",
        mockData,
      );

      expect(consoleSpy).toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
    });

    it("should process summary notification immediately", async () => {
      const mockData: SubmissionNotificationData[] = [
        {
          submissionId: "sub123",
          birthdayName: "Jane Smith",
          birthdayDate: "1990-05-15",
        },
      ];

      (prisma.notificationPreference.findUnique as any).mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: true,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      await notificationService.queueNotification(
        "user123",
        "SUMMARY",
        mockData,
      );

      expect(consoleSpy).toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
    });

    it("should handle errors gracefully", async () => {
      (prisma.notificationPreference.findUnique as any).mockRejectedValue(
        new Error("DB Error"),
      );

      await notificationService.queueNotification("user123", "SUBMISSION", {});

      expect(console.error).toHaveBeenCalledWith(
        "Failed to process notification:",
        expect.any(Error),
      );
    });
  });

  describe("processPendingNotifications", () => {
    it("should log processing message", async () => {
      await notificationService.processPendingNotifications();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Processing pending notifications...",
      );
    });
  });
});
