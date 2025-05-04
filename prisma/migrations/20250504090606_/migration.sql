-- CreateEnum
CREATE TYPE "RegistrationMode" AS ENUM ('INDIVIDUAL', 'TEAM', 'ADMIN');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('PENDING', 'ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'DISQUALIFIED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'DISQUALIFIED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TournamentStageType" AS ENUM ('GROUP', 'BRACKET');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "color" TEXT,
    "adminComment" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "statProfileId" TEXT NOT NULL,
    "mainAccount" BOOLEAN NOT NULL,

    CONSTRAINT "UserGameProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "selfAssignable" BOOLEAN NOT NULL,
    "modAssignable" BOOLEAN NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "comment" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStream" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "UserStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "urlTemplate" TEXT NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseMap" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,

    CONSTRAINT "BaseMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "baseMapId" TEXT NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Civ" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,

    CONSTRAINT "Civ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentSeries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "TournamentSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatchMode" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "gameCount" INTEGER NOT NULL,

    CONSTRAINT "TournamentMatchMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "urlKey" TEXT NOT NULL,
    "registrationMode" "RegistrationMode" NOT NULL,
    "tournamentSeriesId" TEXT NOT NULL,
    "matchModeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isTeamBased" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "participantsLimit" INTEGER,
    "registrationStartDate" TIMESTAMP(3),
    "registrationEndDate" TIMESTAMP(3),
    "status" "TournamentStatus" NOT NULL,
    "isVisible" BOOLEAN NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentSection" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL,
    "content" TEXT,

    CONSTRAINT "TournamentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "tournamentId" TEXT NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "rosterSizeLimit" INTEGER,
    "seedNumber" INTEGER,
    "captainId" TEXT,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentStage" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TournamentStageType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "bracketType" "BracketType",
    "bracketSize" INTEGER,
    "isSeeded" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TournamentStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentBracket" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "bracketType" "BracketType" NOT NULL,
    "bracketSize" INTEGER NOT NULL,
    "isSeeded" BOOLEAN NOT NULL DEFAULT true,
    "isManualSeeding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TournamentBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentBracketNode" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "isWinnerBracket" BOOLEAN NOT NULL DEFAULT true,
    "parentNodeId" TEXT,
    "matchId" TEXT,
    "isManualMatch" BOOLEAN NOT NULL DEFAULT false,
    "adminComment" TEXT,

    CONSTRAINT "TournamentBracketNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentGroup" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "matchModeId" TEXT NOT NULL,
    "isTeamBased" BOOLEAN NOT NULL,

    CONSTRAINT "TournamentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'REGISTERED',
    "seedNumber" INTEGER,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentGroupParticipant" (
    "id" TEXT NOT NULL,
    "tournamentGroupId" TEXT NOT NULL,
    "tournamentParticipantId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "comment" TEXT,
    "seedNumber" INTEGER,

    CONSTRAINT "TournamentGroupParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "civDraftKey" TEXT NOT NULL,
    "mapDraftKey" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL,
    "comment" TEXT,
    "adminComment" TEXT,
    "isManualMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentMatchModeId" TEXT,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatchStream" (
    "id" TEXT NOT NULL,
    "tournamentMatchId" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "status" "StreamStatus" NOT NULL,
    "scheduledStartTime" TIMESTAMP(3),
    "streamUrl" TEXT,
    "scheduledStreamLive" BOOLEAN NOT NULL,

    CONSTRAINT "TournamentMatchStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "participantId" TEXT,
    "teamId" TEXT,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,

    CONSTRAINT "TournamentMatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "gameDate" TIMESTAMP(3) NOT NULL,
    "recUrl" TEXT,
    "winnerId" TEXT NOT NULL,
    "loserId" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameProfile_userId_mainAccount_key" ON "UserGameProfile"("userId", "mainAccount");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_type_key" ON "Platform"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSection_tournamentId_type_key" ON "TournamentSection"("tournamentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_tournamentId_name_key" ON "TournamentTeam"("tournamentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentStage_tournamentId_type_key" ON "TournamentStage"("tournamentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracket_stageId_displayOrder_key" ON "TournamentBracket"("stageId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracketNode_bracketId_round_position_key" ON "TournamentBracketNode"("bracketId", "round", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroup_stageId_name_key" ON "TournamentGroup"("stageId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroup_stageId_displayOrder_key" ON "TournamentGroup"("stageId", "displayOrder");

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_idx" ON "TournamentParticipant"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroupParticipant_tournamentGroupId_tournamentPart_key" ON "TournamentGroupParticipant"("tournamentGroupId", "tournamentParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_groupId_key" ON "TournamentMatch"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchParticipant_matchId_participantId_key" ON "TournamentMatchParticipant"("matchId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchParticipant_matchId_teamId_key" ON "TournamentMatchParticipant"("matchId", "teamId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameProfile" ADD CONSTRAINT "UserGameProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameProfile" ADD CONSTRAINT "UserGameProfile_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStream" ADD CONSTRAINT "UserStream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStream" ADD CONSTRAINT "UserStream_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_baseMapId_fkey" FOREIGN KEY ("baseMapId") REFERENCES "BaseMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSeries" ADD CONSTRAINT "TournamentSeries_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_tournamentSeriesId_fkey" FOREIGN KEY ("tournamentSeriesId") REFERENCES "TournamentSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_matchModeId_fkey" FOREIGN KEY ("matchModeId") REFERENCES "TournamentMatchMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSection" ADD CONSTRAINT "TournamentSection_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentStage" ADD CONSTRAINT "TournamentStage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracket" ADD CONSTRAINT "TournamentBracket_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TournamentStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketNode" ADD CONSTRAINT "TournamentBracketNode_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "TournamentBracket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketNode" ADD CONSTRAINT "TournamentBracketNode_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "TournamentBracketNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketNode" ADD CONSTRAINT "TournamentBracketNode_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TournamentStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_matchModeId_fkey" FOREIGN KEY ("matchModeId") REFERENCES "TournamentMatchMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroupParticipant" ADD CONSTRAINT "TournamentGroupParticipant_tournamentGroupId_fkey" FOREIGN KEY ("tournamentGroupId") REFERENCES "TournamentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroupParticipant" ADD CONSTRAINT "TournamentGroupParticipant_tournamentParticipantId_fkey" FOREIGN KEY ("tournamentParticipantId") REFERENCES "TournamentParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentMatchModeId_fkey" FOREIGN KEY ("tournamentMatchModeId") REFERENCES "TournamentMatchMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchStream" ADD CONSTRAINT "TournamentMatchStream_tournamentMatchId_fkey" FOREIGN KEY ("tournamentMatchId") REFERENCES "TournamentMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchStream" ADD CONSTRAINT "TournamentMatchStream_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchParticipant" ADD CONSTRAINT "TournamentMatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchParticipant" ADD CONSTRAINT "TournamentMatchParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchParticipant" ADD CONSTRAINT "TournamentMatchParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "TournamentMatchParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "TournamentMatchParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
