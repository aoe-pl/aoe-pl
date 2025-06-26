-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_matchId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentMatchStream" DROP CONSTRAINT "TournamentMatchStream_tournamentMatchId_fkey";

-- AddForeignKey
ALTER TABLE "TournamentMatchStream" ADD CONSTRAINT "TournamentMatchStream_tournamentMatchId_fkey" FOREIGN KEY ("tournamentMatchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
