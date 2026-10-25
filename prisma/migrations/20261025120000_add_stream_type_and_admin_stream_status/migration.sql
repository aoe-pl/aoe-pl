-- Add an optional perspective/type to user-marked streams.
CREATE TYPE "StreamType" AS ENUM ('POV', 'COMMENTARY');

-- AlterTable
ALTER TABLE "TournamentMatchStream" ADD COLUMN "streamType" "StreamType";

-- Add an admin-only coverage status to matches.
CREATE TYPE "AdminStreamStatus" AS ENUM ('WILL_BE_COMMENTATED', 'WILL_BE_WATCHED', 'WATCHED', 'COMMENTATED', 'WILL_BE_STREAMED_LIVE');

-- AlterTable
ALTER TABLE "TournamentMatch" ADD COLUMN "adminStreamStatus" "AdminStreamStatus";
