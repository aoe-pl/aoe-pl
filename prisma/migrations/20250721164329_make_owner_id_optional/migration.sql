-- DropForeignKey
ALTER TABLE "TournamentSeries" DROP CONSTRAINT "TournamentSeries_ownerId_fkey";

-- AlterTable
ALTER TABLE "TournamentSeries" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TournamentSeries" ADD CONSTRAINT "TournamentSeries_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
