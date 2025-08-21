-- DropForeignKey
ALTER TABLE "TournamentMatchStream" DROP CONSTRAINT "TournamentMatchStream_streamerId_fkey";

-- CreateTable
CREATE TABLE "Streamer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streamerName" TEXT NOT NULL,
    "streamerUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streamer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Streamer_userId_key" ON "Streamer"("userId");

-- AddForeignKey
ALTER TABLE "Streamer" ADD CONSTRAINT "Streamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchStream" ADD CONSTRAINT "TournamentMatchStream_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
