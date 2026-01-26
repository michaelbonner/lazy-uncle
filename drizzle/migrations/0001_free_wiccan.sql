-- Step 1: Make date column nullable (for backward compatibility)
ALTER TABLE "BirthdaySubmission" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Birthday" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint

-- Step 2: Add new columns as NULLABLE first (to allow migration)
ALTER TABLE "BirthdaySubmission" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "BirthdaySubmission" ADD COLUMN "month" integer;--> statement-breakpoint
ALTER TABLE "BirthdaySubmission" ADD COLUMN "day" integer;--> statement-breakpoint
ALTER TABLE "Birthday" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "Birthday" ADD COLUMN "month" integer;--> statement-breakpoint
ALTER TABLE "Birthday" ADD COLUMN "day" integer;--> statement-breakpoint

-- Step 3: Migrate existing data from date string to components
-- Birthday table
UPDATE "Birthday"
SET
  year = CAST(SUBSTRING(date, 1, 4) AS INTEGER),
  month = CAST(SUBSTRING(date, 6, 2) AS INTEGER),
  day = CAST(SUBSTRING(date, 9, 2) AS INTEGER)
WHERE date IS NOT NULL AND date != '';--> statement-breakpoint

-- BirthdaySubmission table
UPDATE "BirthdaySubmission"
SET
  year = CAST(SUBSTRING(date, 1, 4) AS INTEGER),
  month = CAST(SUBSTRING(date, 6, 2) AS INTEGER),
  day = CAST(SUBSTRING(date, 9, 2) AS INTEGER)
WHERE date IS NOT NULL AND date != '';--> statement-breakpoint

-- Step 4: Make month and day NOT NULL (after data migration)
ALTER TABLE "Birthday" ALTER COLUMN "month" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Birthday" ALTER COLUMN "day" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "BirthdaySubmission" ALTER COLUMN "month" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "BirthdaySubmission" ALTER COLUMN "day" SET NOT NULL;--> statement-breakpoint

-- Step 5: Create index on month/day for efficient upcoming birthday queries
CREATE INDEX "Birthday_month_day_idx" ON "Birthday" USING btree ("month","day");