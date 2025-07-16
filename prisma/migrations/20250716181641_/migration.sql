/*
  Warnings:

  - The values [IN_PROGRESS,CANCELLED] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'ADMIN_APPROVED');
ALTER TABLE "TournamentMatch" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "MatchStatus_old";
COMMIT;
