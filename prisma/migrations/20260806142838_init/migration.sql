-- CreateTable
CREATE TABLE "Champion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "titleJa" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MatchupMemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lane" TEXT NOT NULL,
    "myChampionId" TEXT NOT NULL,
    "opponentChampionId" TEXT NOT NULL,
    "memo" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchupMemo_myChampionId_fkey" FOREIGN KEY ("myChampionId") REFERENCES "Champion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchupMemo_opponentChampionId_fkey" FOREIGN KEY ("opponentChampionId") REFERENCES "Champion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Champion_key_key" ON "Champion"("key");

-- CreateIndex
CREATE INDEX "MatchupMemo_myChampionId_idx" ON "MatchupMemo"("myChampionId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchupMemo_myChampionId_opponentChampionId_lane_key" ON "MatchupMemo"("myChampionId", "opponentChampionId", "lane");
