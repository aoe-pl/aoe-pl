/*
  Warnings:

  - A unique constraint covering the columns `[tournamentId,nickname]` on the table `TournamentParticipant` will be added. If there are existing duplicate values, this will fail.
  - Made the column `nickname` on table `TournamentParticipant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TournamentParticipant" ALTER COLUMN "nickname" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_nickname_key" ON "TournamentParticipant"("tournamentId", "nickname");
