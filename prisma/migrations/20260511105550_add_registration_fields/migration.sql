-- CreateEnum
CREATE TYPE "RegistrationFieldType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN');

-- AlterTable
ALTER TABLE "TournamentParticipant" ADD COLUMN     "registrationData" JSONB;

-- CreateTable
CREATE TABLE "TournamentRegistrationField" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RegistrationFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TournamentRegistrationField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentRegistrationField_tournamentId_idx" ON "TournamentRegistrationField"("tournamentId");

-- AddForeignKey
ALTER TABLE "TournamentRegistrationField" ADD CONSTRAINT "TournamentRegistrationField_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
