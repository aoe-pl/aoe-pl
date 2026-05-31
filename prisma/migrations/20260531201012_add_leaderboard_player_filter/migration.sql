-- CreateTable
CREATE TABLE "LeaderboardPlayerFilter" (
    "id" TEXT NOT NULL,
    "profileId" INTEGER,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardPlayerFilter_pkey" PRIMARY KEY ("id")
);
