-- Stream type is now required for every user-marked stream.
-- Backfill legacy rows; player-marked streams default to POV.
UPDATE "TournamentMatchStream"
SET "streamType" = 'POV'
WHERE "streamType" IS NULL;

ALTER TABLE "TournamentMatchStream"
ALTER COLUMN "streamType" SET NOT NULL;
