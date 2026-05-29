/*
  Warnings:

  - A unique constraint covering the columns `[matchNumber]` on the table `TournamentMatch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playerNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TournamentMatch" ADD COLUMN     "matchNumber" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "playerNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_matchNumber_key" ON "TournamentMatch"("matchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_playerNumber_key" ON "User"("playerNumber");
