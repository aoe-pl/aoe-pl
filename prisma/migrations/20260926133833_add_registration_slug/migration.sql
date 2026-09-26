/*
  Warnings:

  - A unique constraint covering the columns `[tournamentId,slug]` on the table `TournamentRegistrationField` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TournamentRegistrationField" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistrationField_tournamentId_slug_key" ON "TournamentRegistrationField"("tournamentId", "slug");
