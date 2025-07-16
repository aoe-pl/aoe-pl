-- DropForeignKey
ALTER TABLE "GameParticipant" DROP CONSTRAINT "GameParticipant_matchParticipantId_fkey";

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_matchParticipantId_fkey" FOREIGN KEY ("matchParticipantId") REFERENCES "TournamentMatchParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
