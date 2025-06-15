-- DropForeignKey
ALTER TABLE "TournamentGroup" DROP CONSTRAINT "TournamentGroup_matchModeId_fkey";

-- AlterTable
ALTER TABLE "TournamentGroup" ALTER COLUMN "matchModeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_matchModeId_fkey" FOREIGN KEY ("matchModeId") REFERENCES "TournamentMatchMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
