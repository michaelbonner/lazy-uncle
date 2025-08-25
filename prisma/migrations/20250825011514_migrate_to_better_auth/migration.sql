/*
 Warnings:

 - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
 */
-- start a transaction
BEGIN;
--
--
--
--
-- CreateTable
CREATE TABLE "public"."account"(
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "scope" text,
    "oauth_token_secret" text,
    "oauth_token" text,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp(3),
    "refreshTokenExpiresAt" timestamp(3),
    "password" text,
    "createdAt" timestamp(3) NOT NULL,
    "updatedAt" timestamp(3) NOT NULL,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "public"."session"(
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) NOT NULL,
    "token" text NOT NULL,
    "createdAt" timestamp(3) NOT NULL,
    "updatedAt" timestamp(3) NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "public"."user"(
    "id" text NOT NULL,
    "email" text NOT NULL,
    "name" text,
    "emailVerified" boolean NOT NULL DEFAULT FALSE,
    "image" text,
    "createdAt" timestamp(3),
    "updatedAt" timestamp(3) NOT NULL,
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "public"."verification"(
    "id" text NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp(3) NOT NULL,
    "createdAt" timestamp(3),
    "updatedAt" timestamp(3),
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "account_userId_idx" ON "public"."account"("userId");
-- CreateIndex
CREATE INDEX "session_userId_idx" ON "public"."session"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");
-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");
--
--
--
--
--
-- migrate the data
INSERT INTO "public"."user"("id", "email", "name", "emailVerified", "image", "createdAt", "updatedAt")
SELECT
    "id",
    "email",
    "name",
    "emailVerified" IS NOT NULL,
    "image",
    "createdAt",
    now() AS "updatedAt"
FROM
    "public"."User"
WHERE
    "id" IS NOT NULL;
--
INSERT INTO "public"."account"("id", "userId", "scope", "oauth_token_secret", "oauth_token", "accountId", "providerId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "createdAt", "updatedAt")
SELECT
    "id",
    "userId",
    "scope",
    "oauth_token_secret",
    "oauth_token",
    "providerAccountId",
    "provider",
    "access_token",
    "refresh_token",
    "id_token",
    TO_TIMESTAMP("expires_at") AS "accessTokenExpiresAt",
    now() AS "createdAt",
    now() AS "updatedAt"
FROM
    "public"."Account"
WHERE
    "id" IS NOT NULL;
--
INSERT INTO "public"."session"("id", "userId", "expiresAt", "token", "createdAt", "updatedAt")
SELECT
    "id",
    "userId",
    "expires",
    "sessionToken",
    now() AS "createdAt",
    now() AS "updatedAt"
FROM
    "public"."Session"
WHERE
    "id" IS NOT NULL;
-- DropTable
DROP TABLE "public"."Account";
-- DropTable
DROP TABLE "public"."Session";
-- DropTable
DROP TABLE "public"."User";
--
--
--
--
--
-- commit the transaction
COMMIT;

