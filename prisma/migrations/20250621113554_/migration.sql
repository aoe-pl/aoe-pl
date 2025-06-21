/*
  Warnings:

  - You are about to drop the column `disqualified` on the `TournamentGroupParticipant` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'ADMIN_APPROVED';

-- AlterTable
ALTER TABLE "TournamentGroupParticipant" DROP COLUMN "disqualified";
