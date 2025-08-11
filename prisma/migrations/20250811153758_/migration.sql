/*
  Warnings:

  - Made the column `isVisible` on table `TournamentStage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TournamentStage" ALTER COLUMN "isVisible" SET NOT NULL;
