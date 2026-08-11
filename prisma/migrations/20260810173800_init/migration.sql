-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Lane" AS ENUM ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');

-- CreateTable
CREATE TABLE "Champion" (
    "id" TEXT NOT NULL,
    "key" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "titleJa" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Champion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchupMemo" (
    "id" TEXT NOT NULL,
    "lane" "Lane" NOT NULL,
    "myChampionId" TEXT NOT NULL,
    "opponentChampionId" TEXT NOT NULL,
    "memo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchupMemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Champion_key_key" ON "Champion"("key");

-- CreateIndex
CREATE INDEX "MatchupMemo_myChampionId_idx" ON "MatchupMemo"("myChampionId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchupMemo_myChampionId_opponentChampionId_lane_key" ON "MatchupMemo"("myChampionId", "opponentChampionId", "lane");

-- AddForeignKey
ALTER TABLE "MatchupMemo" ADD CONSTRAINT "MatchupMemo_myChampionId_fkey" FOREIGN KEY ("myChampionId") REFERENCES "Champion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchupMemo" ADD CONSTRAINT "MatchupMemo_opponentChampionId_fkey" FOREIGN KEY ("opponentChampionId") REFERENCES "Champion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

