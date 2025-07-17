-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "isTeamBased" SET DEFAULT false;
