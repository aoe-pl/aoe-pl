-- DropIndex
DROP INDEX "TournamentBracketNode_bracketId_round_position_key";

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracketNode_bracketId_round_position_isWinnerBr_key" ON "TournamentBracketNode"("bracketId", "round", "position", "isWinnerBracket");
