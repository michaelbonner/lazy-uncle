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

vi.mock("./db", () => {
  const mockDelete = vi.fn().mockReturnValue({
    where: vi.fn(),
  });
  const mockExecute = vi.fn();
  return {
    default: {
      delete: mockDelete,
      execute: mockExecute,
    query: {
      users: {
        findMany: vi.fn(),
      },
      birthdays: {
        findMany: vi.fn(),
      },
      sharingLinks: {
        findMany: vi.fn(),
      },
      birthdaySubmissions: {
        findMany: vi.fn(),
      },
      notificationPreferences: {
        findMany: vi.fn(),
      },
    },
    },
  };
});

const mockDb = vi.mocked(await import("./db"), true).default;
const mockDelete = mockDb.delete as ReturnType<typeof vi.fn>;
const mockExecute = mockDb.execute as ReturnType<typeof vi.fn>;

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
      // Reset mocks for this test
      vi.clearAllMocks();

      // Mock findMany calls that happen in cleanupOrphanedData
      mockDb.query.sharingLinks.findMany.mockResolvedValue([
        {
          id: "link-1",
          token: "token-1",
          userId: "user-1",
          createdAt: new Date(),
          expiresAt: new Date(),
          isActive: true,
          description: null,
        },
      ]);
      mockDb.query.birthdaySubmissions.findMany
        .mockResolvedValueOnce([
          {
            id: "sub-1",
            sharingLinkId: "invalid-link",
            name: "Test",
            date: "1990-01-01",
            createdAt: new Date(),
            category: null,
            notes: null,
            submitterName: null,
            submitterEmail: null,
            relationship: null,
            status: "PENDING",
          }, // orphaned
        ])
        .mockResolvedValueOnce([
          {
            id: "sub-2",
            status: "IMPORTED",
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            sharingLinkId: "link-1",
            name: "Test",
            date: "1990-01-01",
            category: null,
            notes: null,
            submitterName: null,
            submitterEmail: null,
            relationship: null,
          },
        ]); // old imported
      mockDb.query.users.findMany.mockResolvedValue([
        {
          id: "user-1",
          email: "user@example.com",
          name: null,
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockDb.query.notificationPreferences.findMany.mockResolvedValue([]);

      mockDelete().where.mockResolvedValue([{}]);

      scheduler.start();

      // Fast-forward 12 hours
      vi.advanceTimersByTime(12 * 60 * 60 * 1000);

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(mockDb.query.birthdaySubmissions.findMany).toHaveBeenCalled();
      });

      // Check that the cleanup jobs were called
      expect(mockDb.query.birthdaySubmissions.findMany).toHaveBeenCalled();
      expect(mockDb.query.notificationPreferences.findMany).toHaveBeenCalled();
    });

    it("should perform database maintenance every 24 hours", async () => {
      mockDb.query.users.findMany.mockResolvedValue(
        Array(10).fill({ id: "user" }),
      );
      mockDb.query.birthdays.findMany.mockResolvedValue(
        Array(50).fill({ id: "bday" }),
      );
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce(
          Array(5).fill({
            id: "link",
            isActive: true,
            expiresAt: new Date(Date.now() + 1000000),
          }),
        )
        .mockResolvedValueOnce(
          Array(5).fill({
            id: "link",
            isActive: true,
            expiresAt: new Date(Date.now() + 1000000),
          }),
        );
      mockDb.query.birthdaySubmissions.findMany
        .mockResolvedValueOnce(Array(20).fill({ id: "sub" }))
        .mockResolvedValueOnce(
          Array(10).fill({ id: "sub", status: "PENDING" }),
        );

      mockExecute.mockResolvedValue({});

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
      // Mock findMany calls that happen in cleanupOrphanedData
      mockDb.query.sharingLinks.findMany.mockResolvedValue([
        {
          id: "link-1",
          token: "token-1",
          userId: "user-1",
          createdAt: new Date(),
          expiresAt: new Date(),
          isActive: true,
          description: null,
        },
      ]);
      mockDb.query.birthdaySubmissions.findMany
        .mockResolvedValueOnce([
          {
            id: "sub-1",
            sharingLinkId: "invalid-link",
            name: "Test",
            date: "1990-01-01",
            createdAt: new Date(),
            category: null,
            notes: null,
            submitterName: null,
            submitterEmail: null,
            relationship: null,
            status: "PENDING",
          }, // orphaned
        ])
        .mockResolvedValueOnce([
          {
            id: "sub-2",
            status: "IMPORTED",
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            sharingLinkId: "link-1",
            name: "Test",
            date: "1990-01-01",
            category: null,
            notes: null,
            submitterName: null,
            submitterEmail: null,
            relationship: null,
          },
        ]); // old imported
      mockDb.query.users.findMany.mockResolvedValue([
        {
          id: "user-1",
          email: "user@example.com",
          name: null,
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockDb.query.notificationPreferences.findMany.mockResolvedValue([]);

      mockDelete().where.mockResolvedValue([{}]);

      const metrics = await scheduler.runMaintenanceJob("orphaned-data");

      expect(mockDb.query.birthdaySubmissions.findMany).toHaveBeenCalled();
      expect(metrics.jobName).toBe("orphaned-data-cleanup");
      expect(metrics.status).toBe("success");
      expect(metrics.itemsProcessed).toBe(2); // 1 from orphaned submissions + 0 from preferences + 1 from old imported
    });

    it("should run database maintenance job manually", async () => {
      mockDb.query.users.findMany.mockResolvedValue(
        Array(5).fill({ id: "user" }),
      );
      mockDb.query.birthdays.findMany.mockResolvedValue(
        Array(25).fill({ id: "bday" }),
      );
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce(
          Array(3).fill({
            id: "link",
            isActive: true,
            expiresAt: new Date(Date.now() + 1000000),
          }),
        )
        .mockResolvedValueOnce(
          Array(3).fill({
            id: "link",
            isActive: true,
            expiresAt: new Date(Date.now() + 1000000),
          }),
        );
      mockDb.query.birthdaySubmissions.findMany
        .mockResolvedValueOnce(Array(10).fill({ id: "sub" }))
        .mockResolvedValueOnce(Array(5).fill({ id: "sub", status: "PENDING" }));

      mockExecute.mockResolvedValue({});

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
