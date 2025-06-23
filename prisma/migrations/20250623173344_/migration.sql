/*
  Warnings:

  - You are about to drop the column `gameDate` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BaseMap" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "thumbnailUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "gameDate";

-- AlterTable
ALTER TABLE "Map" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "thumbnailUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TournamentGroup" ADD COLUMN     "isMixed" BOOLEAN;
