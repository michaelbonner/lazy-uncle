import { notificationService } from "../../lib/notification-service";
import { appRouter } from "./_app";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/notification-service", () => ({
  notificationService: {
    updateNotificationPreferences: vi.fn(),
  },
}));

vi.mock("../../lib/db", () => {
  return {
    default: {
      query: {
        notificationPreferences: { findFirst: vi.fn() },
      },
    },
  };
});

const mockDb = vi.mocked(await import("../../lib/db"), true).default;

const user = { id: "user-1", email: "u@example.com", name: "User One" } as never;

function callerFor(ctxUser: unknown) {
  return appRouter.createCaller({
    db: mockDb as never,
    user: ctxUser as never,
    req: { headers: {}, connection: {} },
  });
}

function caller() {
  return callerFor(user);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notification router — auth", () => {
  it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
    await expect(
      callerFor(undefined).notification.preferences(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("notification.preferences", () => {
  it("returns the row for the current user", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue({
      id: "p1",
      userId: "user-1",
      emailNotifications: true,
      summaryNotifications: false,
      birthdayReminders: false,
    });
    const result = await caller().notification.preferences();
    expect(result).toMatchObject({ id: "p1", userId: "user-1" });
  });

  it("returns null when no preference row exists", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue(undefined);
    expect(await caller().notification.preferences()).toBeNull();
  });
});

describe("notification.update", () => {
  it("merges only defined fields and returns the updated row", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue({
      id: "p1",
      userId: "user-1",
      emailNotifications: false,
      summaryNotifications: true,
      birthdayReminders: true,
    });

    const result = await caller().notification.update({
      emailNotifications: false,
      // summaryNotifications omitted -> should not be passed through
      birthdayReminders: true,
    });

    expect(notificationService.updateNotificationPreferences).toHaveBeenCalledWith(
      "user-1",
      { emailNotifications: false, birthdayReminders: true },
    );
    expect(result).toMatchObject({ id: "p1", emailNotifications: false });
  });

  it("passes an empty object when no fields are provided", async () => {
    mockDb.query.notificationPreferences.findFirst.mockResolvedValue({
      id: "p1",
      userId: "user-1",
      emailNotifications: true,
      summaryNotifications: false,
      birthdayReminders: false,
    });
    await caller().notification.update({});
    expect(notificationService.updateNotificationPreferences).toHaveBeenCalledWith(
      "user-1",
      {},
    );
  });
});
