import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotificationService,
  SubmissionNotificationData,
} from "./notification-service";
import prisma from "./prisma";

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

const mockPrisma = vi.mocked(await import("./prisma"), true).default;

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

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
        id: "pref-1",
        userId: "user123",
      };

      mockPrisma.notificationPreference.findUnique.mockResolvedValue(
        mockPreferences,
      );

      const result =
        await notificationService.getUserNotificationPreferences("user123");

      expect(result).toEqual({
        emailNotifications: true,
        summaryNotifications: false,
      });
      expect(mockPrisma.notificationPreference.findUnique).toHaveBeenCalledWith(
        {
          where: { userId: "user123" },
        },
      );
    });

    it("should return default preferences when none exist", async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);

      const result =
        await notificationService.getUserNotificationPreferences("user123");

      expect(result).toEqual({
        emailNotifications: true,
        summaryNotifications: false,
      });
    });

    it("should return default preferences on database error", async () => {
      mockPrisma.notificationPreference.findUnique.mockRejectedValue(
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

      mockPrisma.notificationPreference.upsert.mockResolvedValue({
        id: "pref-1",
        userId: "user123",
        emailNotifications: false,
        summaryNotifications: true,
      });

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

      mockPrisma.notificationPreference.upsert.mockResolvedValue({
        id: "pref-1",
        userId: "user123",
        emailNotifications: false,
        summaryNotifications: false,
      });

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
      mockPrisma.notificationPreference.upsert.mockRejectedValue(
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
      vi.stubEnv("NODE_ENV", "development");
    });

    it("should send notification when preferences allow", async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: false,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
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
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await notificationService.sendSubmissionNotification(
        "user123",
        mockSubmissionData,
      );

      expect(console.error).toHaveBeenCalledWith(
        "No email found for user user123",
      );
    });

    it("should generate correct email content with all fields", async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await notificationService.sendSubmissionNotification(
        "user123",
        mockSubmissionData,
      );

      // Check that the console output contains expected content
      const logCalls = consoleSpy.mock.calls;
      const textContent = logCalls.find(
        (call) =>
          typeof call[0] === "string" && call[0].includes("Hi Test User"),
      );

      expect(textContent).toBeTruthy();
    });

    it("should generate correct email content with minimal fields", async () => {
      const minimalData: SubmissionNotificationData = {
        submissionId: "sub123",
        birthdayName: "Jane Smith",
        birthdayDate: "1990-05-15",
      };

      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: null,
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await notificationService.sendSubmissionNotification(
        "user123",
        minimalData,
      );

      const logCalls = consoleSpy.mock.calls;
      const textContent = logCalls.find(
        (call) => typeof call[0] === "string" && call[0].includes("Hello,"),
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
      vi.stubEnv("NODE_ENV", "development");
    });

    it("should send summary notification when preferences allow", async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: true,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: false,
        summaryNotifications: true,
        id: "pref-1",
        userId: "user123",
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      expect(consoleSpy).not.toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
    });

    it("should not send when summary notifications are disabled", async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      expect(consoleSpy).not.toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
    });

    it("should include all submissions in the summary", async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: true,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await notificationService.sendSummaryNotification(
        "user123",
        mockSubmissions,
      );

      const logCalls = consoleSpy.mock.calls;
      const textContent = logCalls.find(
        (call) =>
          typeof call[0] === "string" &&
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

      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: false,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        summaryNotifications: true,
        id: "pref-1",
        userId: "user123",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
        id: "user123",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await notificationService.queueNotification(
        "user123",
        "SUMMARY",
        mockData,
      );

      expect(consoleSpy).toHaveBeenCalledWith("=== EMAIL NOTIFICATION ===");
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
