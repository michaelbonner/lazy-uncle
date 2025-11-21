CREATE TYPE "public"."SubmissionStatus" AS ENUM('PENDING', 'IMPORTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"scope" text,
	"oauth_token_secret" text,
	"oauth_token" text,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BirthdaySubmission" (
	"id" text PRIMARY KEY NOT NULL,
	"sharingLinkId" text NOT NULL,
	"name" text NOT NULL,
	"date" text NOT NULL,
	"category" text,
	"notes" text,
	"submitterName" text,
	"submitterEmail" text,
	"relationship" text,
	"status" "SubmissionStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Birthday" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" text NOT NULL,
	"category" text,
	"parent" text,
	"notes" text,
	"createdAt" timestamp,
	"userId" text NOT NULL,
	"importSource" text
);
--> statement-breakpoint
CREATE TABLE "NotificationPreference" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"summaryNotifications" boolean DEFAULT false NOT NULL,
	CONSTRAINT "NotificationPreference_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "SharingLink" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"description" text,
	CONSTRAINT "SharingLink_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "VerificationToken_token_unique" UNIQUE("token"),
	CONSTRAINT "VerificationToken_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "BirthdaySubmission_sharingLinkId_idx" ON "BirthdaySubmission" USING btree ("sharingLinkId");--> statement-breakpoint
CREATE INDEX "BirthdaySubmission_status_idx" ON "BirthdaySubmission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Birthday_userId_idx" ON "Birthday" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "SharingLink_userId_idx" ON "SharingLink" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "SharingLink_token_idx" ON "SharingLink" USING btree ("token");