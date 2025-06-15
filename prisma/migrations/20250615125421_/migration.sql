-- DropForeignKey
ALTER TABLE "TournamentGroupParticipant" DROP CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentMatchParticipant" DROP CONSTRAINT "TournamentMatchParticipant_participantId_fkey";

-- AddForeignKey
ALTER TABLE "TournamentGroupParticipant" ADD CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey" FOREIGN KEY ("tournamentParticipantId") REFERENCES "TournamentParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchParticipant" ADD CONSTRAINT "TournamentMatchParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
