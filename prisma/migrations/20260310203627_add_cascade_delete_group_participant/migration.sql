-- DropForeignKey
ALTER TABLE "TournamentGroupParticipant" DROP CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey";

-- AddForeignKey
ALTER TABLE "TournamentGroupParticipant" ADD CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey" FOREIGN KEY ("tournamentParticipantId") REFERENCES "TournamentParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
