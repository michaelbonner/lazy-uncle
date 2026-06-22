import { SecurityMiddleware } from "../../lib/security-middleware";
import { SharingService } from "../../lib/sharing-service";
import { appRouter } from "./_app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/security-middleware");
vi.mock("../../lib/sharing-service");

vi.mock("../../lib/db", () => {
  return {
    default: {
      update: vi.fn(),
      query: {
        sharingLinks: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
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
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sharing router — auth", () => {
  it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
    await expect(callerFor(undefined).sharing.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("sharing.list", () => {
  it("returns the user's active links with submission counts", async () => {
    mockDb.query.sharingLinks.findMany.mockResolvedValue([
      {
        id: "l1",
        userId: "user-1",
        isActive: true,
        submissions: [{ id: "s1" }, { id: "s2" }],
      },
      { id: "l2", userId: "user-1", isActive: true, submissions: [] },
    ] as never);

    const result = await caller().sharing.list();
    expect(result).toHaveLength(2);
    expect(result[0].submissionCount).toBe(2);
    expect(result[1].submissionCount).toBe(0);
  });
});

describe("sharing.create", () => {
  it("creates a link when the rate-limit check passes", async () => {
    vi.mocked(SecurityMiddleware.checkSharingLinkRateLimit).mockResolvedValue({
      allowed: true,
    });
    vi.mocked(SharingService.createSharingLink).mockResolvedValue({
      id: "new-link",
      token: "tok",
      userId: "user-1",
      isActive: true,
    } as never);

    const result = await caller().sharing.create({ description: "hi" });
    expect(result).toMatchObject({ id: "new-link", submissionCount: 0 });
    expect(SharingService.createSharingLink).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", description: "hi" }),
    );
  });

  it("throws TOO_MANY_REQUESTS when the rate-limit check blocks", async () => {
    vi.mocked(SecurityMiddleware.checkSharingLinkRateLimit).mockResolvedValue({
      allowed: false,
      reason: "Too many links",
    });

    await expect(caller().sharing.create({})).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(SharingService.createSharingLink).not.toHaveBeenCalled();
  });
});

describe("sharing.revoke", () => {
  it("returns the result when the service revokes a link", async () => {
    vi.mocked(SharingService.revokeSharingLink).mockResolvedValue({
      id: "l1",
      isActive: false,
    } as never);

    const result = await caller().sharing.revoke({ linkId: "l1" });
    expect(result).toMatchObject({ id: "l1" });
    expect(SharingService.revokeSharingLink).toHaveBeenCalledWith(
      "l1",
      "user-1",
    );
  });

  it("throws NOT_FOUND when the service returns null", async () => {
    vi.mocked(SharingService.revokeSharingLink).mockResolvedValue(null as never);
    await expect(
      caller().sharing.revoke({ linkId: "missing" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("sharing.validate (public)", () => {
  it("returns INVALID_TOKEN when the link does not exist", async () => {
    mockDb.query.sharingLinks.findFirst.mockResolvedValue(undefined);
    const result = await callerFor(undefined).sharing.validate({
      token: "nope",
    });
    expect(result).toMatchObject({ isValid: false, error: "INVALID_TOKEN" });
  });

  it("returns INACTIVE_LINK when the link is deactivated", async () => {
    mockDb.query.sharingLinks.findFirst.mockResolvedValue({
      id: "l1",
      token: "t",
      isActive: false,
      expiresAt: new Date(Date.now() + 100000),
      user: { name: "Owner" },
    } as never);
    const result = await callerFor(undefined).sharing.validate({ token: "t" });
    expect(result).toMatchObject({ isValid: false, error: "INACTIVE_LINK" });
  });

  it("deactivates and returns EXPIRED_LINK when the link is expired", async () => {
    mockDb.query.sharingLinks.findFirst.mockResolvedValue({
      id: "l1",
      token: "t",
      isActive: true,
      expiresAt: new Date(Date.now() - 1000),
      user: { name: "Owner" },
    } as never);
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    mockDb.update.mockReturnValue({ set } as never);

    const result = await callerFor(undefined).sharing.validate({ token: "t" });
    expect(result).toMatchObject({ isValid: false, error: "EXPIRED_LINK" });
    expect(set).toHaveBeenCalledWith({ isActive: false });
  });

  it("deactivates and returns EXPIRED_LINK when the link expires exactly now", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockDb.query.sharingLinks.findFirst.mockResolvedValue({
      id: "l1",
      token: "t",
      isActive: true,
      expiresAt: now,
      user: { name: "Owner" },
    } as never);
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    mockDb.update.mockReturnValue({ set } as never);

    const result = await callerFor(undefined).sharing.validate({ token: "t" });
    expect(result).toMatchObject({ isValid: false, error: "EXPIRED_LINK" });
    expect(set).toHaveBeenCalledWith({ isActive: false });
  });

  it("returns isValid:true with link details for a valid link", async () => {
    mockDb.query.sharingLinks.findFirst.mockResolvedValue({
      id: "l1",
      token: "t",
      description: "Birthday list",
      isActive: true,
      expiresAt: new Date(Date.now() + 100000),
      user: { name: "Owner" },
    } as never);
    const result = await callerFor(undefined).sharing.validate({ token: "t" });
    expect(result).toMatchObject({
      isValid: true,
      sharingLink: { id: "l1", token: "t", ownerName: "Owner" },
    });
  });
});
