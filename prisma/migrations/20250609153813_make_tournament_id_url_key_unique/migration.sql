/*
  Warnings:

  - A unique constraint covering the columns `[tournamentSeriesId,urlKey]` on the table `Tournament` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tournament_tournamentSeriesId_urlKey_key" ON "Tournament"("tournamentSeriesId", "urlKey");
