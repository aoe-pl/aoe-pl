-- AlterTable
ALTER TABLE "TournamentSection" DROP COLUMN IF EXISTS "content",
DROP COLUMN IF EXISTS "title";

-- CreateTable
CREATE TABLE "TournamentSectionTranslation" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,

    CONSTRAINT "TournamentSectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSectionTranslation_sectionId_locale_key" ON "TournamentSectionTranslation"("sectionId", "locale");

-- AddForeignKey
ALTER TABLE "TournamentSectionTranslation" ADD CONSTRAINT "TournamentSectionTranslation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TournamentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
