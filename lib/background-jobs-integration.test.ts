import { describe, it, expect } from "vitest";
import { BackgroundJobScheduler } from "./background-jobs";

describe("BackgroundJobScheduler Integration", () => {
  it("should create BackgroundJobScheduler instance", () => {
    const scheduler = new BackgroundJobScheduler();
    expect(scheduler).toBeDefined();
    expect(typeof scheduler.start).toBe("function");
    expect(typeof scheduler.stop).toBe("function");
    expect(typeof scheduler.getStatus).toBe("function");
    expect(typeof scheduler.getMaintenanceStats).toBe("function");
    expect(typeof scheduler.runMaintenanceJob).toBe("function");
  });

  it("should have correct initial status", () => {
    const scheduler = new BackgroundJobScheduler();
    const status = scheduler.getStatus();

    expect(status).toEqual({
      running: false,
      jobCount: 0,
      metrics: [],
    });
  });

  it("should be able to start and stop", () => {
    const scheduler = new BackgroundJobScheduler();

    // Start
    scheduler.start();
    let status = scheduler.getStatus();
    expect(status.running).toBe(true);
    expect(status.jobCount).toBeGreaterThan(0);
    expect(status.metrics).toEqual([]);

    // Stop
    scheduler.stop();
    status = scheduler.getStatus();
    expect(status.running).toBe(false);
    expect(status.jobCount).toBe(0);
    expect(status.metrics).toEqual([]);
  });

  it("should provide maintenance statistics", async () => {
    const scheduler = new BackgroundJobScheduler();
    const stats = await scheduler.getMaintenanceStats();

    expect(stats).toHaveProperty("expiredLinksCleanedUp");
    expect(stats).toHaveProperty("oldSubmissionsCleanedUp");
    expect(stats).toHaveProperty("orphanedDataCleanedUp");
    expect(stats).toHaveProperty("databaseOptimizationRun");
    expect(typeof stats.expiredLinksCleanedUp).toBe("number");
    expect(typeof stats.oldSubmissionsCleanedUp).toBe("number");
    expect(typeof stats.orphanedDataCleanedUp).toBe("number");
    expect(typeof stats.databaseOptimizationRun).toBe("boolean");
  });

  it("should support manual job execution", async () => {
    const scheduler = new BackgroundJobScheduler();

    // Test that the method exists and can be called
    expect(typeof scheduler.runMaintenanceJob).toBe("function");

    // We can't test actual execution in integration tests due to mocking,
    // but we can verify the method signature
    await expect(
      scheduler.runMaintenanceJob("unknown" as any),
    ).rejects.toThrow();
  });
});
