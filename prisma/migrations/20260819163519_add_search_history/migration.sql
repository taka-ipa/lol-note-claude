-- CreateTable
CREATE TABLE "SummonerSearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SummonerSearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SummonerSearchHistory_userId_searchedAt_idx" ON "SummonerSearchHistory"("userId", "searchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SummonerSearchHistory_userId_platform_gameName_tagLine_key" ON "SummonerSearchHistory"("userId", "platform", "gameName", "tagLine");

-- AddForeignKey
ALTER TABLE "SummonerSearchHistory" ADD CONSTRAINT "SummonerSearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
