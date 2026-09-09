-- CreateTable
CREATE TABLE "RiotApiCache" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiotApiCache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "RiotApiCache_expiresAt_idx" ON "RiotApiCache"("expiresAt");
