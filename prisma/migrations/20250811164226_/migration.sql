-- DropForeignKey
ALTER TABLE "TournamentBracket" DROP CONSTRAINT "TournamentBracket_stageId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentBracketNode" DROP CONSTRAINT "TournamentBracketNode_bracketId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentGroup" DROP CONSTRAINT "TournamentGroup_stageId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentStage" DROP CONSTRAINT "TournamentStage_tournamentId_fkey";

-- AddForeignKey
ALTER TABLE "TournamentStage" ADD CONSTRAINT "TournamentStage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracket" ADD CONSTRAINT "TournamentBracket_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TournamentStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketNode" ADD CONSTRAINT "TournamentBracketNode_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "TournamentBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TournamentStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
