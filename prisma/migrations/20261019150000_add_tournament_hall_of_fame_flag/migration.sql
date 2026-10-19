-- Allow admins to exclude a tournament from the Hall of Fame.
ALTER TABLE "Tournament" ADD COLUMN "includeInHallOfFame" BOOLEAN NOT NULL DEFAULT true;
