"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Platform } from "@/lib/riot";
import type { SearchHistoryEntry } from "@/lib/searchHistory";

const MAX_ENTRIES = 20;

export async function getSearchHistoryDb(): Promise<SearchHistoryEntry[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const rows = await prisma.summonerSearchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "desc" },
    take: MAX_ENTRIES,
  });

  return rows.map((r) => ({
    platform: r.platform as Platform,
    gameName: r.gameName,
    tagLine: r.tagLine,
    searchedAt: r.searchedAt.getTime(),
  }));
}

export async function addSearchHistoryDb(entry: {
  platform: Platform;
  gameName: string;
  tagLine: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await prisma.summonerSearchHistory.upsert({
    where: {
      userId_platform_gameName_tagLine: {
        userId,
        platform: entry.platform,
        gameName: entry.gameName,
        tagLine: entry.tagLine,
      },
    },
    update: { searchedAt: new Date() },
    create: { userId, ...entry },
  });

  const overflow = await prisma.summonerSearchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "desc" },
    skip: MAX_ENTRIES,
    select: { id: true },
  });
  if (overflow.length > 0) {
    await prisma.summonerSearchHistory.deleteMany({
      where: { id: { in: overflow.map((o) => o.id) } },
    });
  }
}
