-- DropForeignKey
ALTER TABLE "TournamentGroupParticipant" DROP CONSTRAINT "TournamentGroupParticipant_tournamentGroupId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentGroupParticipant" DROP CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentMatch" DROP CONSTRAINT "TournamentMatch_groupId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentMatchParticipant" DROP CONSTRAINT "TournamentMatchParticipant_matchId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentMatchParticipant" DROP CONSTRAINT "TournamentMatchParticipant_participantId_fkey";

-- AddForeignKey
ALTER TABLE "TournamentGroupParticipant" ADD CONSTRAINT "TournamentGroupParticipant_tournamentGroupId_fkey" FOREIGN KEY ("tournamentGroupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroupParticipant" ADD CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey" FOREIGN KEY ("tournamentParticipantId") REFERENCES "TournamentParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchParticipant" ADD CONSTRAINT "TournamentMatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchParticipant" ADD CONSTRAINT "TournamentMatchParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
