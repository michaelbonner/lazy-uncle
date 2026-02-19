import { eq } from "drizzle-orm";
import { enumType, objectType } from "nexus";
import {
  birthdaySubmissions,
  notificationPreferences,
  sharingLinks,
} from "../../drizzle/schema";

export const SubmissionStatus = enumType({
  name: "SubmissionStatus",
  members: ["PENDING", "IMPORTED", "REJECTED"],
});

export const SharingLink = objectType({
  name: "SharingLink",
  definition(t) {
    t.string("id");
    t.string("token");
    t.field("createdAt", {
      type: "DateTime",
    });
    t.field("expiresAt", {
      type: "DateTime",
    });
    t.boolean("isActive");
    t.nullable.string("description");
    t.int("submissionCount", {
      resolve: async (parent, args, ctx) => {
        if (!parent.id) {
          return 0;
        }
        const submissions = await ctx.db.query.birthdaySubmissions.findMany({
          where: eq(birthdaySubmissions.sharingLinkId, parent.id),
        });
        return submissions?.length ?? 0;
      },
    });
    t.nullable.field("user", {
      type: "User",
      resolve: async (parent, args, ctx) => {
        const sharingLink = await ctx.db.query.sharingLinks.findFirst({
          where: eq(sharingLinks.id, parent.id || ""),
          with: { user: true },
        });
        return sharingLink?.user ?? null;
      },
    });
  },
});

export const BirthdaySubmission = objectType({
  name: "BirthdaySubmission",
  definition(t) {
    t.string("id");
    t.string("name");

    // NEW: Expose individual date components
    t.nullable.int("year"); // Nullable for birthdays without year
    t.int("month"); // 1-12
    t.int("day"); // 1-31

    // DEPRECATED: Keep for backward compatibility
    t.nullable.string("date", {
      resolve: (parent) => {
        if (parent.year && parent.month && parent.day) {
          const yearStr = parent.year.toString().padStart(4, "0");
          const monthStr = parent.month.toString().padStart(2, "0");
          const dayStr = parent.day.toString().padStart(2, "0");
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
        if (parent.month && parent.day) {
          const monthStr = parent.month.toString().padStart(2, "0");
          const dayStr = parent.day.toString().padStart(2, "0");
          return `--${monthStr}-${dayStr}`;
        }
        return null;
      },
    });

    t.nullable.string("category");
    t.nullable.string("notes");
    t.nullable.string("submitterName");
    t.nullable.string("submitterEmail");
    t.nullable.string("relationship");
    t.field("status", {
      type: "SubmissionStatus",
    });
    t.field("createdAt", {
      type: "DateTime",
    });
    t.nullable.field("sharingLink", {
      type: "SharingLink",
      resolve: async (parent, args, ctx) => {
        const submission = await ctx.db.query.birthdaySubmissions.findFirst({
          where: eq(birthdaySubmissions.id, parent.id || ""),
          with: { sharingLink: true },
        });
        return submission?.sharingLink ?? null;
      },
    });
  },
});
export const NotificationPreference = objectType({
  name: "NotificationPreference",
  definition(t) {
    t.string("id");
    t.string("userId");
    t.boolean("emailNotifications");
    t.boolean("summaryNotifications");
    t.boolean("birthdayReminders");
    t.nullable.field("user", {
      type: "User",
      resolve: async (parent, args, ctx) => {
        const pref = await ctx.db.query.notificationPreferences.findFirst({
          where: eq(notificationPreferences.id, parent.id || ""),
          with: { user: true },
        });
        return pref?.user ?? null;
      },
    });
  },
});

export const PaginatedSubmissions = objectType({
  name: "PaginatedSubmissions",
  definition(t) {
    t.list.field("submissions", {
      type: "BirthdaySubmission",
    });
    t.int("totalCount");
    t.boolean("hasNextPage");
    t.boolean("hasPreviousPage");
    t.int("currentPage");
    t.int("totalPages");
  },
});

export const BulkSubmissionResult = objectType({
  name: "BulkSubmissionResult",
  definition(t) {
    t.boolean("success");
    t.int("processedCount");
    t.int("failedCount");
    t.list.string("failedIds");
    t.list.string("errors");
  },
});

export const DuplicateMatch = objectType({
  name: "DuplicateMatch",
  definition(t) {
    t.string("id");
    t.string("name");

    // NEW: Expose individual date components
    t.nullable.int("year");
    t.int("month");
    t.int("day");

    // DEPRECATED: Computed field for backward compatibility
    t.nullable.string("date", {
      resolve: (parent) => {
        if (parent.year && parent.month && parent.day) {
          const yearStr = parent.year.toString().padStart(4, "0");
          const monthStr = parent.month.toString().padStart(2, "0");
          const dayStr = parent.day.toString().padStart(2, "0");
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
        if (parent.month && parent.day) {
          const monthStr = parent.month.toString().padStart(2, "0");
          const dayStr = parent.day.toString().padStart(2, "0");
          return `--${monthStr}-${dayStr}`;
        }
        return null;
      },
    });

    t.nullable.string("category");
    t.float("similarity");
  },
});

export const DuplicateDetectionResult = objectType({
  name: "DuplicateDetectionResult",
  definition(t) {
    t.boolean("hasDuplicates");
    t.list.field("matches", {
      type: "DuplicateMatch",
    });
  },
});

export const SharingLinkInfo = objectType({
  name: "SharingLinkInfo",
  definition(t) {
    t.string("id");
    t.string("token");
    t.nullable.string("description");
    t.field("expiresAt", {
      type: "DateTime",
    });
    t.nullable.string("ownerName");
  },
});

export const SharingLinkValidation = objectType({
  name: "SharingLinkValidation",
  definition(t) {
    t.boolean("isValid");
    t.nullable.string("error");
    t.nullable.string("message");
    t.nullable.field("sharingLink", {
      type: "SharingLinkInfo",
    });
  },
});
