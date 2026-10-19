-- Manually included AoE2Companion profiles for the top players list.
CREATE TABLE "LeaderboardPlayerInclude" (
    "id" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardPlayerInclude_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeaderboardPlayerInclude_profileId_key" ON "LeaderboardPlayerInclude"("profileId");
