/*
  Warnings:

  - You are about to drop the column `userId` on the `GameParticipant` table. All the data in the column will be lost.
  - Made the column `matchParticipantId` on table `GameParticipant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GameParticipant" DROP CONSTRAINT "GameParticipant_matchParticipantId_fkey";

-- DropForeignKey
ALTER TABLE "GameParticipant" DROP CONSTRAINT "GameParticipant_userId_fkey";

-- AlterTable
ALTER TABLE "GameParticipant" DROP COLUMN "userId",
ALTER COLUMN "matchParticipantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_matchParticipantId_fkey" FOREIGN KEY ("matchParticipantId") REFERENCES "TournamentMatchParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
