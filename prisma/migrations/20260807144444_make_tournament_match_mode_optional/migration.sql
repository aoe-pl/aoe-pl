/*
  Warnings:

  - You are about to drop the column `isSeeded` on the `TournamentStage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_matchModeId_fkey";

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "matchModeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TournamentBracket" ADD COLUMN     "roundBestOfs" JSONB;

-- AlterTable
ALTER TABLE "TournamentMatch" ADD COLUMN     "bestOf" INTEGER;

-- AlterTable
ALTER TABLE "TournamentStage" DROP COLUMN "isSeeded";

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_matchModeId_fkey" FOREIGN KEY ("matchModeId") REFERENCES "TournamentMatchMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
