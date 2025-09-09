import { notificationService } from "./notification-service";
import { SubmissionService } from "./submission-service";
import { SharingService } from "./sharing-service";
import prisma from "./prisma";
import { SubmissionStatus } from "@prisma/client";

export interface JobScheduler {
  start(): void;
  stop(): void;
}

export interface JobMetrics {
  jobName: string;
  lastRun: Date;
  duration: number;
  status: "success" | "error";
  itemsProcessed?: number;
  error?: string;
}

export interface MaintenanceStats {
  expiredLinksCleanedUp: number;
  oldSubmissionsCleanedUp: number;
  orphanedDataCleanedUp: number;
  databaseOptimizationRun: boolean;
}

export class BackgroundJobScheduler implements JobScheduler {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;
  private jobMetrics: Map<string, JobMetrics> = new Map();

  /**
   * Start all background jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log("Background jobs already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting background jobs...");

    // Process notifications every 30 seconds
    const notificationInterval = setInterval(async () => {
      await this.runJobWithMetrics("notification-processing", async () => {
        await notificationService.processPendingNotifications();
        return 0; // No specific count for notifications
      });
    }, 30 * 1000);

    // Clean up expired sharing links every hour
    const linkCleanupInterval = setInterval(
      async () => {
        await this.runJobWithMetrics("expired-links-cleanup", async () => {
          const cleaned = await SharingService.cleanupExpiredLinks();
          if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired sharing links`);
          }
          return cleaned;
        });
      },
      60 * 60 * 1000,
    );

    // Clean up old rejected submissions every 6 hours
    const submissionCleanupInterval = setInterval(
      async () => {
        await this.runJobWithMetrics("old-submissions-cleanup", async () => {
          const cleaned =
            await SubmissionService.cleanupOldRejectedSubmissions(30);
          if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} old rejected submissions`);
          }
          return cleaned;
        });
      },
      6 * 60 * 60 * 1000,
    );

    // Clean up orphaned data every 12 hours
    const orphanedDataCleanupInterval = setInterval(
      async () => {
        await this.runJobWithMetrics("orphaned-data-cleanup", async () => {
          const cleaned = await this.cleanupOrphanedData();
          if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} orphaned data records`);
          }
          return cleaned;
        });
      },
      12 * 60 * 60 * 1000,
    );

    // Database maintenance every 24 hours
    const databaseMaintenanceInterval = setInterval(
      async () => {
        await this.runJobWithMetrics("database-maintenance", async () => {
          await this.performDatabaseMaintenance();
          console.log("Database maintenance completed");
          return 1; // Indicate maintenance was performed
        });
      },
      24 * 60 * 60 * 1000,
    );

    // Process summary notifications daily at 9 AM
    const summaryInterval = setInterval(
      async () => {
        await this.runJobWithMetrics(
          "daily-summary-notifications",
          async () => {
            await this.processDailySummaryNotifications();
            return 0; // No specific count for summary notifications
          },
        );
      },
      24 * 60 * 60 * 1000,
    );

    // Log job metrics every hour
    const metricsLoggingInterval = setInterval(
      () => {
        this.logJobMetrics();
      },
      60 * 60 * 1000,
    );

    this.intervals.push(
      notificationInterval,
      linkCleanupInterval,
      submissionCleanupInterval,
      orphanedDataCleanupInterval,
      databaseMaintenanceInterval,
      summaryInterval,
      metricsLoggingInterval,
    );

    console.log("Background jobs started successfully");
  }

  /**
   * Stop all background jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log("Stopping background jobs...");

    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.intervals = [];
    this.isRunning = false;

    console.log("Background jobs stopped");
  }

  /**
   * Run a job with metrics tracking and error handling
   */
  private async runJobWithMetrics(
    jobName: string,
    jobFunction: () => Promise<number>,
  ): Promise<void> {
    const startTime = Date.now();
    const runTime = new Date();

    try {
      const itemsProcessed = await jobFunction();
      const duration = Date.now() - startTime;

      this.jobMetrics.set(jobName, {
        jobName,
        lastRun: runTime,
        duration,
        status: "success",
        itemsProcessed,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.jobMetrics.set(jobName, {
        jobName,
        lastRun: runTime,
        duration,
        status: "error",
        error: errorMessage,
      });

      console.error(`Error in background job ${jobName}:`, error);
    }
  }

  /**
   * Clean up orphaned data that may accumulate over time
   */
  private async cleanupOrphanedData(): Promise<number> {
    let totalCleaned = 0;

    try {
      // Clean up submissions for deleted sharing links
      const orphanedSubmissions = await prisma.birthdaySubmission.deleteMany({
        where: {
          sharingLink: {
            is: undefined,
          },
        },
      });
      totalCleaned += orphanedSubmissions.count;

      // Clean up notification preferences for deleted users
      const orphanedPreferences =
        await prisma.notificationPreference.deleteMany({
          where: {
            user: {
              is: undefined,
            },
          },
        });
      totalCleaned += orphanedPreferences.count;

      // Clean up very old imported submissions (older than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const oldImportedSubmissions = await prisma.birthdaySubmission.deleteMany(
        {
          where: {
            status: SubmissionStatus.IMPORTED,
            createdAt: {
              lt: oneYearAgo,
            },
          },
        },
      );
      totalCleaned += oldImportedSubmissions.count;

      return totalCleaned;
    } catch (error) {
      console.error("Error cleaning up orphaned data:", error);
      return 0;
    }
  }

  /**
   * Perform database maintenance tasks
   */
  private async performDatabaseMaintenance(): Promise<void> {
    try {
      // Update statistics for query optimization
      // Note: This is PostgreSQL-specific. In a real implementation,
      // you might want to check the database type first
      if (process.env.NODE_ENV === "production") {
        await prisma.$executeRaw`ANALYZE;`;
        console.log("Database statistics updated");
      }

      // Log database size and table statistics
      await this.logDatabaseStatistics();
    } catch (error) {
      console.error("Error performing database maintenance:", error);
    }
  }

  /**
   * Log database statistics for monitoring
   */
  private async logDatabaseStatistics(): Promise<void> {
    try {
      const stats = await this.getDatabaseStatistics();
      console.log("Database Statistics:", JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error("Error logging database statistics:", error);
    }
  }

  /**
   * Get database statistics for monitoring
   */
  private async getDatabaseStatistics(): Promise<{
    totalUsers: number;
    totalBirthdays: number;
    totalSharingLinks: number;
    activeSharingLinks: number;
    totalSubmissions: number;
    pendingSubmissions: number;
  }> {
    const [
      totalUsers,
      totalBirthdays,
      totalSharingLinks,
      activeSharingLinks,
      totalSubmissions,
      pendingSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.birthday.count(),
      prisma.sharingLink.count(),
      prisma.sharingLink.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.birthdaySubmission.count(),
      prisma.birthdaySubmission.count({
        where: { status: "PENDING" },
      }),
    ]);

    return {
      totalUsers,
      totalBirthdays,
      totalSharingLinks,
      activeSharingLinks,
      totalSubmissions,
      pendingSubmissions,
    };
  }

  /**
   * Process daily summary notifications for users who have pending submissions
   */
  private async processDailySummaryNotifications(): Promise<void> {
    try {
      console.log("Processing daily summary notifications...");

      // Find users with pending submissions and summary notifications enabled
      const usersWithPendingSubmissions = await prisma.user.findMany({
        where: {
          notificationPreference: {
            summaryNotifications: true,
          },
          sharingLinks: {
            some: {
              submissions: {
                some: {
                  status: SubmissionStatus.PENDING,
                },
              },
            },
          },
        },
        include: {
          sharingLinks: {
            include: {
              submissions: {
                where: {
                  status: SubmissionStatus.PENDING,
                },
              },
            },
          },
        },
      });

      for (const user of usersWithPendingSubmissions) {
        const totalPendingSubmissions = user.sharingLinks.reduce(
          (total, link) => total + link.submissions.length,
          0,
        );

        if (totalPendingSubmissions > 0) {
          try {
            await notificationService.queueNotification(user.id, "SUMMARY", [
              {
                submissionId: "pending-submission-id",
                birthdayName: "Pending Birthday",
                birthdayDate: "2024-01-01",
                submitterName: user.name || user.email,
              },
            ]);
          } catch (notificationError) {
            console.error(
              `Failed to queue summary notification for user ${user.id}:`,
              notificationError,
            );
          }
        }
      }

      console.log(
        `Processed summary notifications for ${usersWithPendingSubmissions.length} users`,
      );
    } catch (error) {
      console.error("Error processing daily summary notifications:", error);
    }
  }

  /**
   * Log job metrics for monitoring
   */
  private logJobMetrics(): void {
    if (this.jobMetrics.size === 0) {
      return;
    }

    console.log("=== Background Job Metrics ===");
    for (const [jobName, metrics] of this.jobMetrics.entries()) {
      const status = metrics.status === "success" ? "✅" : "❌";
      const itemsInfo =
        metrics.itemsProcessed !== undefined
          ? ` (${metrics.itemsProcessed} items)`
          : "";

      console.log(
        `${status} ${jobName}: ${metrics.duration}ms${itemsInfo} - ${metrics.lastRun.toISOString()}`,
      );

      if (metrics.error) {
        console.log(`   Error: ${metrics.error}`);
      }
    }
    console.log("==============================");
  }

  /**
   * Get the current status of background jobs
   */
  getStatus(): {
    running: boolean;
    jobCount: number;
    metrics: JobMetrics[];
  } {
    return {
      running: this.isRunning,
      jobCount: this.intervals.length,
      metrics: Array.from(this.jobMetrics.values()),
    };
  }

  /**
   * Get maintenance statistics
   */
  async getMaintenanceStats(): Promise<MaintenanceStats> {
    const expiredLinksMetric = this.jobMetrics.get("expired-links-cleanup");
    const oldSubmissionsMetric = this.jobMetrics.get("old-submissions-cleanup");
    const orphanedDataMetric = this.jobMetrics.get("orphaned-data-cleanup");
    const databaseMaintenanceMetric = this.jobMetrics.get(
      "database-maintenance",
    );

    return {
      expiredLinksCleanedUp: expiredLinksMetric?.itemsProcessed || 0,
      oldSubmissionsCleanedUp: oldSubmissionsMetric?.itemsProcessed || 0,
      orphanedDataCleanedUp: orphanedDataMetric?.itemsProcessed || 0,
      databaseOptimizationRun: databaseMaintenanceMetric?.status === "success",
    };
  }

  /**
   * Force run a specific maintenance job (for testing/manual execution)
   */
  async runMaintenanceJob(
    jobType:
      | "expired-links"
      | "old-submissions"
      | "orphaned-data"
      | "database-maintenance",
  ): Promise<JobMetrics> {
    switch (jobType) {
      case "expired-links":
        await this.runJobWithMetrics("expired-links-cleanup", async () => {
          return await SharingService.cleanupExpiredLinks();
        });
        break;
      case "old-submissions":
        await this.runJobWithMetrics("old-submissions-cleanup", async () => {
          return await SubmissionService.cleanupOldRejectedSubmissions(30);
        });
        break;
      case "orphaned-data":
        await this.runJobWithMetrics("orphaned-data-cleanup", async () => {
          return await this.cleanupOrphanedData();
        });
        break;
      case "database-maintenance":
        await this.runJobWithMetrics("database-maintenance", async () => {
          await this.performDatabaseMaintenance();
          return 1;
        });
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    // Map job types to their metric keys
    const metricKeyMap: Record<string, string> = {
      "expired-links": "expired-links-cleanup",
      "old-submissions": "old-submissions-cleanup",
      "orphaned-data": "orphaned-data-cleanup",
      "database-maintenance": "database-maintenance",
    };
    const metricKey = metricKeyMap[jobType];
    if (!metricKey) {
      throw new Error(`Unknown job type: ${jobType}`);
    }
    const metrics = this.jobMetrics.get(metricKey);
    if (!metrics) {
      throw new Error(`No metrics found for job type: ${jobType}`);
    }
    if (!metrics) {
      throw new Error(`No metrics found for job type: ${jobType}`);
    }

    return metrics;
  }
}

// Export singleton instance
export const backgroundJobScheduler = new BackgroundJobScheduler();

// Auto-start in production
if (process.env.NODE_ENV === "production") {
  backgroundJobScheduler.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("Received SIGTERM, stopping background jobs...");
    backgroundJobScheduler.stop();
  });

  process.on("SIGINT", () => {
    console.log("Received SIGINT, stopping background jobs...");
    backgroundJobScheduler.stop();
  });
}
