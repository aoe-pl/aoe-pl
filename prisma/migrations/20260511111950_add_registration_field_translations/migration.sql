/*
  Warnings:

  - You are about to drop the column `label` on the `TournamentRegistrationField` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TournamentRegistrationField" DROP COLUMN "label";

-- CreateTable
CREATE TABLE "TournamentRegistrationFieldTranslation" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TournamentRegistrationFieldTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistrationFieldTranslation_fieldId_locale_key" ON "TournamentRegistrationFieldTranslation"("fieldId", "locale");

-- AddForeignKey
ALTER TABLE "TournamentRegistrationFieldTranslation" ADD CONSTRAINT "TournamentRegistrationFieldTranslation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "TournamentRegistrationField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
