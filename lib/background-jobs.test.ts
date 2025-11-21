import { BackgroundJobScheduler } from "./background-jobs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the services
vi.mock("./notification-service", () => ({
  notificationService: {
    processPendingNotifications: vi.fn(),
    queueNotification: vi.fn(),
  },
}));

vi.mock("./sharing-service", () => ({
  SharingService: {
    cleanupExpiredLinks: vi.fn(),
  },
}));

vi.mock("./submission-service", () => ({
  SubmissionService: {
    cleanupOldRejectedSubmissions: vi.fn(),
  },
}));

vi.mock("./prisma", () => ({
  default: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    birthday: {
      count: vi.fn(),
    },
    sharingLink: {
      count: vi.fn(),
    },
    birthdaySubmission: {
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    notificationPreference: {
      deleteMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
  },
}));

describe("BackgroundJobScheduler", () => {
  let scheduler: BackgroundJobScheduler;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scheduler = new BackgroundJobScheduler();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    scheduler.stop();
    vi.clearAllMocks();
    vi.useRealTimers();
    consoleSpy.mockRestore();
  });

  describe("start", () => {
    it("should start background jobs successfully", () => {
      scheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith("Starting background jobs...");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Background jobs started successfully",
      );

      const status = scheduler.getStatus();
      expect(status.running).toBe(true);
      expect(status.jobCount).toBe(7); // 7 intervals
    });

    it("should not start jobs if already running", () => {
      scheduler.start();
      consoleSpy.mockClear();

      scheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Background jobs already running",
      );
    });

    it("should process notifications every 30 seconds", async () => {
      const { notificationService } = await import("./notification-service");

      scheduler.start();

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30 * 1000);

      expect(
        notificationService.processPendingNotifications,
      ).toHaveBeenCalledTimes(1);

      // Fast-forward another 30 seconds
      vi.advanceTimersByTime(30 * 1000);

      expect(
        notificationService.processPendingNotifications,
      ).toHaveBeenCalledTimes(2);
    });

    it("should clean up expired links every hour", async () => {
      const { SharingService } = await import("./sharing-service");
      (
        SharingService.cleanupExpiredLinks as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(5);

      scheduler.start();

      // Fast-forward 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(SharingService.cleanupExpiredLinks).toHaveBeenCalledTimes(1);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Cleaned up 5 expired sharing links",
      );
    });

    it("should clean up old submissions every 6 hours", async () => {
      const { SubmissionService } = await import("./submission-service");
      (
        SubmissionService.cleanupOldRejectedSubmissions as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(3);

      scheduler.start();

      // Fast-forward 6 hours
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(
          SubmissionService.cleanupOldRejectedSubmissions,
        ).toHaveBeenCalledWith(30);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Cleaned up 3 old rejected submissions",
      );
    });

    it("should handle notification processing errors gracefully", async () => {
      const { notificationService } = await import("./notification-service");
      (
        notificationService.processPendingNotifications as unknown as {
          mockRejectedValue: (value: Error) => void;
        }
      ).mockRejectedValue(new Error("Processing failed"));

      scheduler.start();

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error in background job notification-processing:",
          expect.any(Error),
        );
      });
    });

    it("should handle link cleanup errors gracefully", async () => {
      const { SharingService } = await import("./sharing-service");
      (
        SharingService.cleanupExpiredLinks as unknown as {
          mockRejectedValue: (value: Error) => void;
        }
      ).mockRejectedValue(new Error("Cleanup failed"));

      scheduler.start();

      // Fast-forward 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error in background job expired-links-cleanup:",
          expect.any(Error),
        );
      });
    });

    it("should handle submission cleanup errors gracefully", async () => {
      const { SubmissionService } = await import("./submission-service");
      (
        SubmissionService.cleanupOldRejectedSubmissions as unknown as {
          mockRejectedValue: (value: Error) => void;
        }
      ).mockRejectedValue(new Error("Cleanup failed"));

      scheduler.start();

      // Fast-forward 6 hours
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error in background job old-submissions-cleanup:",
          expect.any(Error),
        );
      });
    });
  });

  describe("stop", () => {
    it("should stop background jobs successfully", () => {
      scheduler.start();
      consoleSpy.mockClear();

      scheduler.stop();

      expect(consoleSpy).toHaveBeenCalledWith("Stopping background jobs...");
      expect(consoleSpy).toHaveBeenCalledWith("Background jobs stopped");

      const status = scheduler.getStatus();
      expect(status.running).toBe(false);
      expect(status.jobCount).toBe(0);
    });

    it("should not error when stopping already stopped jobs", () => {
      scheduler.stop();

      // Should not throw or log anything
      const status = scheduler.getStatus();
      expect(status.running).toBe(false);
    });

    it("should clear all intervals when stopped", async () => {
      const { notificationService } = await import("./notification-service");

      scheduler.start();
      scheduler.stop();

      // Fast-forward time to ensure no jobs run
      vi.advanceTimersByTime(60 * 60 * 1000);

      expect(
        notificationService.processPendingNotifications,
      ).not.toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("should return correct status when stopped", () => {
      const status = scheduler.getStatus();

      expect(status).toEqual({
        running: false,
        jobCount: 0,
        metrics: [],
      });
    });

    it("should return correct status when running", () => {
      scheduler.start();
      const status = scheduler.getStatus();

      expect(status).toEqual({
        running: true,
        jobCount: 7,
        metrics: [],
      });
    });
  });

  describe("daily summary processing", () => {
    it("should process daily summaries every 24 hours", () => {
      scheduler.start();

      // Fast-forward 24 hours
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Processing daily summary notifications...",
      );
    });

    it("should clean up orphaned data every 12 hours", async () => {
      const prisma = await import("./prisma");
      // Reset mocks for this test
      vi.clearAllMocks();

      // Mock all three deleteMany calls that happen in cleanupOrphanedData
      (
        prisma.default.birthdaySubmission.deleteMany as unknown as {
          mockResolvedValue: (value: { count: number }) => void;
        }
      ).mockResolvedValue({
        count: 1,
      });
      (
        prisma.default.notificationPreference.deleteMany as unknown as {
          mockResolvedValue: (value: { count: number }) => void;
        }
      ).mockResolvedValue({ count: 0 });

      scheduler.start();

      // Fast-forward 12 hours
      vi.advanceTimersByTime(12 * 60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(prisma.default.birthdaySubmission.deleteMany).toHaveBeenCalled();
      });

      // Check that the cleanup jobs were called
      expect(prisma.default.birthdaySubmission.deleteMany).toHaveBeenCalled();
      expect(
        prisma.default.notificationPreference.deleteMany,
      ).toHaveBeenCalled();
    });

    it("should perform database maintenance every 24 hours", async () => {
      const prisma = await import("./prisma");
      (
        prisma.default.user.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(10);
      (
        prisma.default.birthday.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(50);
      (
        prisma.default.sharingLink.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(5);
      (
        prisma.default.birthdaySubmission.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(20);

      scheduler.start();

      // Fast-forward 24 hours
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Database maintenance completed",
        );
      });
    });

    it("should log job metrics every hour", () => {
      scheduler.start();

      // Fast-forward 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Should not log metrics if there are no metrics yet
      // The logJobMetrics method only logs if there are metrics
      expect(consoleSpy).not.toHaveBeenCalledWith(
        "=== Background Job Metrics ===",
      );
    });
  });

  describe("getMaintenanceStats", () => {
    it("should return maintenance statistics", async () => {
      const stats = await scheduler.getMaintenanceStats();

      expect(stats).toEqual({
        expiredLinksCleanedUp: 0,
        oldSubmissionsCleanedUp: 0,
        orphanedDataCleanedUp: 0,
        databaseOptimizationRun: false,
      });
    });
  });

  describe("runMaintenanceJob", () => {
    it("should run expired links cleanup job manually", async () => {
      const { SharingService } = await import("./sharing-service");
      (
        SharingService.cleanupExpiredLinks as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(3);

      const metrics = await scheduler.runMaintenanceJob("expired-links");

      expect(SharingService.cleanupExpiredLinks).toHaveBeenCalled();
      expect(metrics.jobName).toBe("expired-links-cleanup");
      expect(metrics.status).toBe("success");
      expect(metrics.itemsProcessed).toBe(3);
    });

    it("should run old submissions cleanup job manually", async () => {
      const { SubmissionService } = await import("./submission-service");
      (
        SubmissionService.cleanupOldRejectedSubmissions as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(2);

      const metrics = await scheduler.runMaintenanceJob("old-submissions");

      expect(
        SubmissionService.cleanupOldRejectedSubmissions,
      ).toHaveBeenCalledWith(30);
      expect(metrics.jobName).toBe("old-submissions-cleanup");
      expect(metrics.status).toBe("success");
      expect(metrics.itemsProcessed).toBe(2);
    });

    it("should run orphaned data cleanup job manually", async () => {
      const prisma = await import("./prisma");
      // Mock all three deleteMany calls that happen in cleanupOrphanedData
      (
        prisma.default.birthdaySubmission.deleteMany as unknown as {
          mockResolvedValueOnce: (value: { count: number }) => void;
        }
      ).mockResolvedValueOnce({ count: 1 });

      (
        prisma.default.notificationPreference.deleteMany as unknown as {
          mockResolvedValue: (value: { count: number }) => void;
        }
      ).mockResolvedValue({ count: 0 });

      const metrics = await scheduler.runMaintenanceJob("orphaned-data");

      expect(prisma.default.birthdaySubmission.deleteMany).toHaveBeenCalled();
      expect(metrics.jobName).toBe("orphaned-data-cleanup");
      expect(metrics.status).toBe("success");
      expect(metrics.itemsProcessed).toBe(2); // 1 from orphaned submissions + 0 from preferences + 1 from old imported
    });

    it("should run database maintenance job manually", async () => {
      const prisma = await import("./prisma");
      (
        prisma.default.user.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(5);
      (
        prisma.default.birthday.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(25);
      (
        prisma.default.sharingLink.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(3);
      (
        prisma.default.birthdaySubmission.count as unknown as {
          mockResolvedValue: (value: number) => void;
        }
      ).mockResolvedValue(10);

      const metrics = await scheduler.runMaintenanceJob("database-maintenance");

      expect(metrics.jobName).toBe("database-maintenance");
      expect(metrics.status).toBe("success");
      expect(metrics.itemsProcessed).toBe(1);
    });

    it("should throw error for unknown job type", async () => {
      await expect(
        scheduler.runMaintenanceJob(
          "unknown" as unknown as
            | "expired-links"
            | "old-submissions"
            | "orphaned-data"
            | "database-maintenance",
        ),
      ).rejects.toThrow("Unknown job type: unknown");
    });
  });
});
