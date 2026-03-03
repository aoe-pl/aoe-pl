/*
  Warnings:

  - You are about to drop the column `type` on the `TournamentSection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tournamentId,slug]` on the table `TournamentSection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `TournamentSection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `TournamentSection` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TournamentSection" DROP CONSTRAINT "TournamentSection_tournamentId_fkey";

-- DropIndex
DROP INDEX "TournamentSection_tournamentId_type_key";

-- AlterTable
ALTER TABLE "TournamentSection" DROP COLUMN "type",
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "isVisible" SET DEFAULT true;

-- DropEnum
DROP TYPE "TournamentSectionType";

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSection_tournamentId_slug_key" ON "TournamentSection"("tournamentId", "slug");

-- AddForeignKey
ALTER TABLE "TournamentSection" ADD CONSTRAINT "TournamentSection_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
