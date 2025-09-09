import { enumType, objectType } from "nexus";

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
        const count = await ctx.prisma.birthdaySubmission.count({
          where: { sharingLinkId: parent.id },
        });
        return count;
      },
    });
    t.nullable.field("user", {
      type: "User",
      resolve: (parent, args, ctx) =>
        ctx.prisma.sharingLink
          .findUnique({
            where: { id: parent.id || "" },
          })
          .user(),
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
      resolve: (parent, args, ctx) =>
        ctx.prisma.birthdaySubmission
          .findUnique({
            where: { id: parent.id || "" },
          })
          .sharingLink(),
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
      resolve: (parent, args, ctx) =>
        ctx.prisma.notificationPreference
          .findUnique({
            where: { id: parent.id || "" },
          })
          .user(),
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
