-- AlterTable
ALTER TABLE "User" ADD COLUMN     "streamUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchStream_tournamentMatchId_streamerId_key" ON "TournamentMatchStream"("tournamentMatchId", "streamerId");
