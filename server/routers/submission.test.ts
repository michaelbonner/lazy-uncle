import { SecurityMiddleware } from "../../lib/security-middleware";
import { SubmissionService } from "../../lib/submission-service";
import { appRouter } from "./_app";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/security-middleware");
vi.mock("../../lib/submission-service");

vi.mock("../../lib/db", () => {
  return {
    default: {
      query: {
        sharingLinks: { findMany: vi.fn() },
        birthdaySubmissions: { findMany: vi.fn(), findFirst: vi.fn() },
        birthdays: { findFirst: vi.fn() },
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

describe("submission router — auth", () => {
  it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
    await expect(callerFor(undefined).submission.pending()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("submission.pending", () => {
  it("returns an empty page when the user has no sharing links", async () => {
    mockDb.query.sharingLinks.findMany.mockResolvedValue([]);
    const result = await caller().submission.pending();
    expect(result).toMatchObject({ totalCount: 0, submissions: [], totalPages: 0 });
    expect(mockDb.query.birthdaySubmissions.findMany).not.toHaveBeenCalled();
  });

  it("paginates pending submissions scoped to the user's links", async () => {
    mockDb.query.sharingLinks.findMany.mockResolvedValue([{ id: "l1" }] as never);
    const all = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i}`,
      name: "N",
      year: 1990,
      month: 1,
      day: 1,
      status: "PENDING",
      sharingLinkId: "l1",
      sharingLink: { id: "l1", description: "d" },
    }));
    mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(all as never);

    const result = await caller().submission.pending({ page: 1, limit: 10 });
    expect(result.submissions).toHaveLength(10);
    expect(result.totalCount).toBe(15);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
    expect(result.totalPages).toBe(2);
    expect(result.submissions[0]).toHaveProperty("date");
  });

  it("computes second-page flags correctly", async () => {
    mockDb.query.sharingLinks.findMany.mockResolvedValue([{ id: "l1" }] as never);
    const all = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i}`,
      name: "N",
      year: 1990,
      month: 1,
      day: 1,
      status: "PENDING",
      sharingLinkId: "l1",
      sharingLink: { id: "l1", description: "d" },
    }));
    mockDb.query.birthdaySubmissions.findMany.mockResolvedValue(all as never);

    const result = await caller().submission.pending({ page: 2, limit: 10 });
    expect(result.currentPage).toBe(2);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
  });
});

describe("submission.submit (public)", () => {
  it("creates a submission when security passes and the service succeeds", async () => {
    vi.mocked(SecurityMiddleware.checkSubmissionSecurity).mockResolvedValue({
      allowed: true,
    });
    vi.mocked(SubmissionService.processSubmission).mockResolvedValue({
      success: true,
      submissionId: "sub-1",
    });
    mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue({
      id: "sub-1",
      name: "John",
      year: 1990,
      month: 5,
      day: 15,
      status: "PENDING",
    } as never);

    const result = await callerFor(undefined).submission.submit({
      token: "tok",
      name: "John",
      year: 1990,
      month: 5,
      day: 15,
    });
    expect(result).toMatchObject({ id: "sub-1", date: "1990-05-15" });
    expect(SubmissionService.processSubmission).toHaveBeenCalledWith(
      "tok",
      expect.objectContaining({ name: "John", month: 5, day: 15 }),
    );
  });

  it("throws TOO_MANY_REQUESTS when security blocks the submission", async () => {
    vi.mocked(SecurityMiddleware.checkSubmissionSecurity).mockResolvedValue({
      allowed: false,
      reason: "blocked",
    });
    await expect(
      callerFor(undefined).submission.submit({
        token: "tok",
        name: "John",
        month: 5,
        day: 15,
      }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(SubmissionService.processSubmission).not.toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when the service reports failure", async () => {
    vi.mocked(SecurityMiddleware.checkSubmissionSecurity).mockResolvedValue({
      allowed: true,
    });
    vi.mocked(SubmissionService.processSubmission).mockResolvedValue({
      success: false,
      errors: ["Invalid or expired sharing link"],
    });
    await expect(
      callerFor(undefined).submission.submit({
        token: "bad",
        name: "John",
        month: 5,
        day: 15,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("submission.import", () => {
  it("returns the created birthday on success", async () => {
    vi.mocked(SubmissionService.importSubmission).mockResolvedValue({
      success: true,
      birthdayId: "b1",
    });
    mockDb.query.birthdays.findFirst.mockResolvedValue({
      id: "b1",
      name: "John",
      year: 1990,
      month: 5,
      day: 15,
    } as never);
    const result = await caller().submission.import({ submissionId: "sub-1" });
    expect(result).toMatchObject({ id: "b1", date: "1990-05-15" });
    expect(SubmissionService.importSubmission).toHaveBeenCalledWith(
      "sub-1",
      "user-1",
    );
  });

  it("throws BAD_REQUEST when import fails", async () => {
    vi.mocked(SubmissionService.importSubmission).mockResolvedValue({
      success: false,
      errors: ["Submission not found"],
    });
    await expect(
      caller().submission.import({ submissionId: "x" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("submission.reject", () => {
  it("returns the rejected submission on success", async () => {
    vi.mocked(SubmissionService.rejectSubmission).mockResolvedValue({
      success: true,
    });
    mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue({
      id: "sub-1",
      name: "John",
      year: 1990,
      month: 5,
      day: 15,
      status: "REJECTED",
    } as never);
    const result = await caller().submission.reject({ submissionId: "sub-1" });
    expect(result).toMatchObject({ id: "sub-1" });
  });

  it("throws BAD_REQUEST when reject fails", async () => {
    vi.mocked(SubmissionService.rejectSubmission).mockResolvedValue({
      success: false,
      errors: ["Already processed"],
    });
    await expect(
      caller().submission.reject({ submissionId: "x" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("submission.bulkImport / bulkReject", () => {
  it("maps a successful bulk import result", async () => {
    vi.mocked(SubmissionService.bulkImportSubmissions).mockResolvedValue({
      success: true,
      imported: 3,
      failed: [],
      errors: [],
    });
    const result = await caller().submission.bulkImport({
      submissionIds: ["a", "b", "c"],
    });
    expect(result).toEqual({
      success: true,
      processedCount: 3,
      failedCount: 0,
      failedIds: [],
      errors: [],
    });
  });

  it("maps a partial-failure bulk reject result", async () => {
    vi.mocked(SubmissionService.bulkRejectSubmissions).mockResolvedValue({
      success: false,
      rejected: 1,
      failed: ["b"],
      errors: ["Submission b already processed"],
    });
    const result = await caller().submission.bulkReject({
      submissionIds: ["a", "b"],
    });
    expect(result).toEqual({
      success: false,
      processedCount: 1,
      failedCount: 1,
      failedIds: ["b"],
      errors: ["Submission b already processed"],
    });
  });
});

describe("submission.duplicates", () => {
  it("throws NOT_FOUND when the submission is missing", async () => {
    mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue(undefined);
    await expect(
      caller().submission.duplicates({ submissionId: "x" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NOT_FOUND when the submission belongs to another user's link", async () => {
    mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue({
      id: "sub-1",
      name: "John",
      year: 1990,
      month: 5,
      day: 15,
      sharingLink: { userId: "someone-else" },
    } as never);
    await expect(
      caller().submission.duplicates({ submissionId: "sub-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(SubmissionService.detectDuplicates).not.toHaveBeenCalled();
  });

  it("returns duplicate matches (with date) for an owned submission", async () => {
    mockDb.query.birthdaySubmissions.findFirst.mockResolvedValue({
      id: "sub-1",
      name: "John",
      year: 1990,
      month: 5,
      day: 15,
      sharingLink: { userId: "user-1" },
    } as never);
    vi.mocked(SubmissionService.detectDuplicates).mockResolvedValue({
      hasDuplicates: true,
      matches: [
        { id: "b1", name: "John", year: 1990, month: 5, day: 15, similarity: 0.95 },
      ],
    } as never);

    const result = await caller().submission.duplicates({ submissionId: "sub-1" });
    expect(result.hasDuplicates).toBe(true);
    expect(result.matches[0]).toMatchObject({ id: "b1", date: "1990-05-15" });
    expect(SubmissionService.detectDuplicates).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "John", month: 5, day: 15 }),
    );
  });
});
