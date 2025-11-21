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
    t.string("date");
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
    t.string("date");
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
