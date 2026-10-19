-- Rename the cached AoE2Companion rating columns to match their domain name.
ALTER TABLE "User" RENAME COLUMN "eloRating" TO "rating";
ALTER TABLE "User" RENAME COLUMN "eloRatingUpdatedAt" TO "ratingUpdatedAt";
