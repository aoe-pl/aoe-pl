-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "gameNumber" INTEGER,
ADD COLUMN     "recordingKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
