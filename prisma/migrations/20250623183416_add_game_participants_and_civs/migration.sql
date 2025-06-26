/*
  Warnings:

  - You are about to drop the column `loserId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_loserId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_winnerId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "loserId",
DROP COLUMN "winnerId";

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "civId" TEXT,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "matchParticipantId" TEXT,
    "displayName" TEXT,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_civId_fkey" FOREIGN KEY ("civId") REFERENCES "Civ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_matchParticipantId_fkey" FOREIGN KEY ("matchParticipantId") REFERENCES "TournamentMatchParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
