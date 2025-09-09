-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'IMPORTED', 'REJECTED');
-- CreateTable
CREATE TABLE "public"."SharingLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    CONSTRAINT "SharingLink_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "public"."BirthdaySubmission" (
    "id" TEXT NOT NULL,
    "sharingLinkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "relationship" TEXT,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BirthdaySubmission_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "summaryNotifications" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "SharingLink_token_key" ON "public"."SharingLink"("token");
-- CreateIndex
CREATE INDEX "SharingLink_userId_idx" ON "public"."SharingLink"("userId");
-- CreateIndex
CREATE INDEX "SharingLink_token_idx" ON "public"."SharingLink"("token");
-- CreateIndex
CREATE INDEX "BirthdaySubmission_sharingLinkId_idx" ON "public"."BirthdaySubmission"("sharingLinkId");
-- CreateIndex
CREATE INDEX "BirthdaySubmission_status_idx" ON "public"."BirthdaySubmission"("status");
-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference"("userId");