/*
  Warnings:

  - You are about to drop the column `customName` on the `TournamentParticipant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TournamentParticipant" DROP COLUMN "customName",
ADD COLUMN     "nickname" TEXT;
