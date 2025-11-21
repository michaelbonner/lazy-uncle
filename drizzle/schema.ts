import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  index,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const submissionStatusEnum = pgEnum("SubmissionStatus", [
  "PENDING",
  "IMPORTED",
  "REJECTED",
]);

// Tables
export const users = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("userId").notNull(),
    scope: text("scope"),
    oauthTokenSecret: text("oauth_token_secret"),
    oauthToken: text("oauth_token"),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("userId").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const birthdays = pgTable(
  "Birthday",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    date: text("date").notNull(),
    category: text("category"),
    parent: text("parent"),
    notes: text("notes"), // Text type in Prisma maps to text in Drizzle
    createdAt: timestamp("createdAt"),
    userId: text("userId").notNull(),
    importSource: text("importSource"),
  },
  (table) => [index("Birthday_userId_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    id: text("id").primaryKey().notNull(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [unique().on(table.identifier, table.token)],
);

export const verifications = pgTable("verification", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const sharingLinks = pgTable(
  "SharingLink",
  {
    id: text("id").primaryKey().notNull(),
    token: text("token").notNull(),
    userId: text("userId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    description: text("description"),
  },
  (table) => [
    unique().on(table.token),
    index("SharingLink_userId_idx").on(table.userId),
    index("SharingLink_token_idx").on(table.token),
  ],
);

export const birthdaySubmissions = pgTable(
  "BirthdaySubmission",
  {
    id: text("id").primaryKey().notNull(),
    sharingLinkId: text("sharingLinkId").notNull(),
    name: text("name").notNull(),
    date: text("date").notNull(),
    category: text("category"),
    notes: text("notes"), // Text type in Prisma maps to text in Drizzle
    submitterName: text("submitterName"),
    submitterEmail: text("submitterEmail"),
    relationship: text("relationship"),
    status: submissionStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("BirthdaySubmission_sharingLinkId_idx").on(table.sharingLinkId),
    index("BirthdaySubmission_status_idx").on(table.status),
  ],
);

export const notificationPreferences = pgTable("NotificationPreference", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId").notNull().unique(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  summaryNotifications: boolean("summaryNotifications")
    .default(false)
    .notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  birthdays: many(birthdays),
  sharingLinks: many(sharingLinks),
  notificationPreference: one(notificationPreferences),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const birthdaysRelations = relations(birthdays, ({ one }) => ({
  user: one(users, {
    fields: [birthdays.userId],
    references: [users.id],
  }),
}));

export const sharingLinksRelations = relations(
  sharingLinks,
  ({ one, many }) => ({
    user: one(users, {
      fields: [sharingLinks.userId],
      references: [users.id],
    }),
    submissions: many(birthdaySubmissions),
  }),
);

export const birthdaySubmissionsRelations = relations(
  birthdaySubmissions,
  ({ one }) => ({
    sharingLink: one(sharingLinks, {
      fields: [birthdaySubmissions.sharingLinkId],
      references: [sharingLinks.id],
    }),
  }),
);

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  }),
);

// Better Auth expects these exact names, so export aliases
export const user = users;
export const session = sessions;
export const account = accounts;
export const verification = verifications;

// Type exports for convenience
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Birthday = typeof birthdays.$inferSelect;
export type NewBirthday = typeof birthdays.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type SharingLink = typeof sharingLinks.$inferSelect;
export type NewSharingLink = typeof sharingLinks.$inferInsert;
export type BirthdaySubmission = typeof birthdaySubmissions.$inferSelect;
export type NewBirthdaySubmission = typeof birthdaySubmissions.$inferInsert;
export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
  typeof notificationPreferences.$inferInsert;
export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
