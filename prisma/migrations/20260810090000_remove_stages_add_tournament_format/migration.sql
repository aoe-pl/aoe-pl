-- Remove stages: one format per tournament (GROUP or BRACKET).
-- Dev environment reset: all existing tournament data is dropped.

-- New enum
CREATE TYPE "TournamentFormat" AS ENUM ('GROUP', 'BRACKET');

-- Tournament: add format. Rows are wiped first, so a plain NOT NULL works.
-- TRUNCATE CASCADE drops every table referencing Tournament (participants,
-- teams, sections, brackets, groups, matches, games, streams, ...) in one
-- shot, so no FK is violated regardless of its onDelete action.
TRUNCATE TABLE "Tournament" CASCADE;
ALTER TABLE "Tournament" ADD COLUMN "format" "TournamentFormat" NOT NULL DEFAULT 'GROUP';
ALTER TABLE "Tournament" ALTER COLUMN "format" DROP DEFAULT;

-- TournamentGroup: stageId -> tournamentId
DROP INDEX "TournamentGroup_stageId_name_key";
ALTER TABLE "TournamentGroup" DROP CONSTRAINT "TournamentGroup_stageId_fkey";
ALTER TABLE "TournamentGroup" DROP COLUMN "stageId";
ALTER TABLE "TournamentGroup" ADD COLUMN "tournamentId" TEXT;
ALTER TABLE "TournamentGroup" ALTER COLUMN "tournamentId" SET NOT NULL;
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "TournamentGroup_tournamentId_name_key" ON "TournamentGroup"("tournamentId", "name");

-- TournamentBracket: stageId -> tournamentId
ALTER TABLE "TournamentBracket" DROP CONSTRAINT "TournamentBracket_stageId_fkey";
ALTER TABLE "TournamentBracket" DROP COLUMN "stageId";
ALTER TABLE "TournamentBracket" ADD COLUMN "tournamentId" TEXT;
ALTER TABLE "TournamentBracket" ALTER COLUMN "tournamentId" SET NOT NULL;
ALTER TABLE "TournamentBracket" ADD CONSTRAINT "TournamentBracket_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the stage table and its enum
DROP TABLE "TournamentStage";
DROP TYPE "TournamentStageType";
