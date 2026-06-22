import { InputValidator } from "../../lib/input-validator";
import { appRouter } from "./_app";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/input-validator");

vi.mock("../../lib/db", () => {
  return {
    default: {
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      query: {
        birthdays: {
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

/** Helper to wire up a chained insert/update/delete returning() mock. */
function chainReturning(returnValue: unknown) {
  const returning = vi.fn().mockResolvedValue(returnValue);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const values = vi.fn().mockReturnValue({ returning });
  return { returning, where, set, values };
}

beforeEach(() => {
  vi.clearAllMocks();
  // By default, validation passes.
  vi.mocked(InputValidator.validateMonth).mockReturnValue({
    isValid: true,
    sanitized: 5,
  });
  vi.mocked(InputValidator.validateDay).mockReturnValue({
    isValid: true,
    sanitized: 15,
  });
  vi.mocked(InputValidator.validateYear).mockReturnValue({
    isValid: true,
    sanitized: 1990,
  });
  vi.mocked(InputValidator.sanitizeString).mockImplementation((value) =>
    typeof value === "string" ? value.trim().replace(/[<>]/g, "") : "",
  );
});

describe("birthday router — auth", () => {
  it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
    await expect(
      callerFor(undefined).birthday.list(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a context whose user has no id", async () => {
    await expect(
      callerFor({ email: "x" }).birthday.list(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("birthday.byId", () => {
  it("returns the row (with date) when owned by the user", async () => {
    mockDb.query.birthdays.findFirst.mockResolvedValue({
      id: "b1",
      name: "Bob",
      year: 1990,
      month: 5,
      day: 15,
      userId: "user-1",
    } as never);

    const result = await caller().birthday.byId({ birthdayId: "b1" });
    expect(result).toMatchObject({ id: "b1", date: "1990-05-15" });
  });

  it("returns null when not found", async () => {
    mockDb.query.birthdays.findFirst.mockResolvedValue(undefined);
    expect(await caller().birthday.byId({ birthdayId: "missing" })).toBeNull();
  });

  it("returns null when owned by a different user", async () => {
    mockDb.query.birthdays.findFirst.mockResolvedValue(undefined);
    expect(await caller().birthday.byId({ birthdayId: "b1" })).toBeNull();
  });
});

describe("birthday.list", () => {
  it("returns the user's birthdays each with a computed date", async () => {
    mockDb.query.birthdays.findMany.mockResolvedValue([
      { id: "b1", name: "A", year: 1990, month: 5, day: 15, userId: "user-1" },
      { id: "b2", name: "B", year: null, month: 1, day: 2, userId: "user-1" },
    ] as never);

    const result = await caller().birthday.list();
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("1990-05-15");
    expect(result[1].date).toBe("--01-02");
  });
});

describe("birthday.create", () => {
  it("validates input and inserts with the user's id", async () => {
    const chain = chainReturning([
      {
        id: "new",
        name: "New",
        year: 1990,
        month: 5,
        day: 15,
        userId: "user-1",
      },
    ]);
    mockDb.insert.mockReturnValue({ values: chain.values } as never);

    const result = await caller().birthday.create({
      name: "New",
      year: 1990,
      month: 5,
      day: 15,
    });

    expect(result).toMatchObject({ id: "new", date: "1990-05-15" });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New", userId: "user-1", month: 5 }),
    );
  });

  it("throws BAD_REQUEST on an invalid month", async () => {
    vi.mocked(InputValidator.validateMonth).mockReturnValue({
      isValid: false,
      sanitized: 0,
    });

    await expect(
      caller().birthday.create({ name: "X", month: 13, day: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("throws BAD_REQUEST on an invalid day", async () => {
    vi.mocked(InputValidator.validateDay).mockReturnValue({
      isValid: false,
      sanitized: 0,
    });
    await expect(
      caller().birthday.create({ name: "X", month: 2, day: 30 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("throws BAD_REQUEST on an invalid year", async () => {
    vi.mocked(InputValidator.validateYear).mockReturnValue({
      isValid: false,
      sanitized: null,
    });
    await expect(
      caller().birthday.create({ name: "X", year: 1800, month: 5, day: 15 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("birthday.edit", () => {
  it("updates and returns the row when found", async () => {
    const chain = chainReturning([
      { id: "b1", name: "Edited", year: 1990, month: 5, day: 15, userId: "user-1" },
    ]);
    mockDb.update.mockReturnValue({ set: chain.set } as never);

    const result = await caller().birthday.edit({
      id: "b1",
      name: "Edited",
      year: 1990,
      month: 5,
      day: 15,
    });
    expect(result).toMatchObject({ id: "b1", name: "Edited" });
  });

  it("throws NOT_FOUND when no row matches id + userId", async () => {
    const chain = chainReturning([]);
    mockDb.update.mockReturnValue({ set: chain.set } as never);

    await expect(
      caller().birthday.edit({ id: "b1", name: "X", month: 5, day: 15 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("validates before updating", async () => {
    vi.mocked(InputValidator.validateMonth).mockReturnValue({
      isValid: false,
      sanitized: 0,
    });
    await expect(
      caller().birthday.edit({ id: "b1", name: "X", month: 99, day: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe("birthday.delete", () => {
  it("deletes and returns the row when found", async () => {
    const returning = vi.fn().mockResolvedValue([
      { id: "b1", name: "Gone", year: 1990, month: 5, day: 15, userId: "user-1" },
    ]);
    const where = vi.fn().mockReturnValue({ returning });
    mockDb.delete.mockReturnValue({ where } as never);

    const result = await caller().birthday.delete({ birthdayId: "b1" });
    expect(result).toMatchObject({ id: "b1" });
  });

  it("throws NOT_FOUND when no row matches id + userId", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    mockDb.delete.mockReturnValue({ where } as never);

    await expect(
      caller().birthday.delete({ birthdayId: "nope" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

// Ensure TRPCError is the thrown type, not a plain Error.
describe("error typing", () => {
  it("throws TRPCError instances", async () => {
    await expect(
      callerFor(undefined).birthday.byId({ birthdayId: "x" }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
