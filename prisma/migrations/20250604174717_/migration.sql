/*
  Warnings:

  - You are about to drop the column `endDate` on the `TournamentStage` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `TournamentStage` table. All the data in the column will be lost.
  - Added the required column `name` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `mode` on the `TournamentMatchMode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `TournamentSection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TournamentMatchModeType" AS ENUM ('BEST_OF', 'PLAY_ALL');

-- CreateEnum
CREATE TYPE "TournamentSectionType" AS ENUM ('HOW_TO_START', 'RULES', 'PRIZES', 'GENERAL');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TournamentMatchMode" DROP COLUMN "mode",
ADD COLUMN     "mode" "TournamentMatchModeType" NOT NULL;

-- AlterTable
ALTER TABLE "TournamentSection" DROP COLUMN "type",
ADD COLUMN     "type" "TournamentSectionType" NOT NULL;

-- AlterTable
ALTER TABLE "TournamentStage" DROP COLUMN "endDate",
DROP COLUMN "startDate";

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSection_tournamentId_type_key" ON "TournamentSection"("tournamentId", "type");
