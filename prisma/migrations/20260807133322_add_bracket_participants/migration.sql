/*
  Warnings:

  - You are about to drop the column `bracketSize` on the `TournamentStage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TournamentStage" DROP COLUMN "bracketSize";

-- CreateTable
CREATE TABLE "TournamentBracketParticipant" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "participantId" TEXT,
    "teamId" TEXT,
    "seedNumber" INTEGER,

    CONSTRAINT "TournamentBracketParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracketParticipant_bracketId_participantId_key" ON "TournamentBracketParticipant"("bracketId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracketParticipant_bracketId_teamId_key" ON "TournamentBracketParticipant"("bracketId", "teamId");

-- AddForeignKey
ALTER TABLE "TournamentBracketParticipant" ADD CONSTRAINT "TournamentBracketParticipant_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "TournamentBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketParticipant" ADD CONSTRAINT "TournamentBracketParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketParticipant" ADD CONSTRAINT "TournamentBracketParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "TournamentBracketNode_bracketId_round_position_isWinnerBr_key" RENAME TO "TournamentBracketNode_bracketId_round_position_isWinnerBrac_key";
