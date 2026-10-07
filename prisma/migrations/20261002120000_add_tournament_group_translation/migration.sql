-- CreateTable
CREATE TABLE "TournamentGroupTranslation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TournamentGroupTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroupTranslation_groupId_locale_key" ON "TournamentGroupTranslation"("groupId", "locale");

-- AddForeignKey
ALTER TABLE "TournamentGroupTranslation" ADD CONSTRAINT "TournamentGroupTranslation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing (single-language) descriptions into the default locale ("pl").
INSERT INTO "TournamentGroupTranslation" ("id", "groupId", "locale", "description")
SELECT
    'grp-translation-' || "id" || '-pl',
    "id",
    'pl',
    "description"
FROM "TournamentGroup"
WHERE "description" IS NOT NULL AND "description" <> '';

-- AlterTable
ALTER TABLE "TournamentGroup" DROP COLUMN IF EXISTS "description";
