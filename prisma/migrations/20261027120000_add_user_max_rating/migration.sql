-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maxRating" INTEGER;

-- Seed the peak with the currently cached rating so existing players show a
-- value before their profile is refreshed again.
UPDATE "User" SET "maxRating" = "rating" WHERE "rating" IS NOT NULL;
