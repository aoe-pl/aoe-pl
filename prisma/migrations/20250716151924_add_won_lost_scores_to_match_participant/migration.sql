-- AlterTable
ALTER TABLE "TournamentMatchParticipant" ADD COLUMN     "lostScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wonScore" INTEGER NOT NULL DEFAULT 0;
