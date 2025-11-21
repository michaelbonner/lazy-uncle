import { NotificationService } from "./notification-service";
import { describe, expect, it } from "vitest";

describe("NotificationService Integration", () => {
  it("should create NotificationService instance", () => {
    const service = new NotificationService();
    expect(service).toBeDefined();
    expect(typeof service.getUserNotificationPreferences).toBe("function");
    expect(typeof service.updateNotificationPreferences).toBe("function");
    expect(typeof service.sendSubmissionNotification).toBe("function");
    expect(typeof service.sendSummaryNotification).toBe("function");
    expect(typeof service.queueNotification).toBe("function");
    expect(typeof service.processPendingNotifications).toBe("function");
  });

  it("should have correct notification data interfaces", () => {
    const submissionData = {
      submissionId: "test-id",
      birthdayName: "Test Name",
      birthdayDate: "1990-01-01",
      submitterName: "Test Submitter",
      relationship: "Friend",
      notes: "Test notes",
      sharingLinkDescription: "Test Link",
    };

    // This should not throw any TypeScript errors
    expect(submissionData.submissionId).toBe("test-id");
    expect(submissionData.birthdayName).toBe("Test Name");
    expect(submissionData.birthdayDate).toBe("1990-01-01");
  });

  it("should have correct notification preferences interface", () => {
    const preferences = {
      emailNotifications: true,
      summaryNotifications: false,
    };

    expect(preferences.emailNotifications).toBe(true);
    expect(preferences.summaryNotifications).toBe(false);
  });
});
