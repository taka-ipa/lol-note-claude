import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, type Platform } from "@/lib/riot";
import SummonerSearch from "@/components/SummonerSearch";

function parseRiotIdSlug(
  slug: string
): { gameName: string; tagLine: string } | null {
  const lastDash = slug.lastIndexOf("-");
  if (lastDash <= 0 || lastDash === slug.length - 1) return null;
  return {
    gameName: slug.slice(0, lastDash),
    tagLine: slug.slice(lastDash + 1),
  };
}

function isPlatform(value: string): value is Platform {
  return PLATFORMS.some((p) => p.value === value);
}

type Params = { platform: string; riotId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { riotId } = await params;
  const parsed = parseRiotIdSlug(decodeURIComponent(riotId));
  if (!parsed) return { title: "LoL Matchup Note" };
  return {
    title: `${parsed.gameName}#${parsed.tagLine} - LoL Matchup Note`,
  };
}

export default async function SummonerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { platform, riotId } = await params;

  if (!isPlatform(platform)) notFound();
  const parsed = parseRiotIdSlug(decodeURIComponent(riotId));
  if (!parsed) notFound();

  const [session, champions] = await Promise.all([
    auth(),
    prisma.champion.findMany({
      select: { id: true, nameJa: true, iconUrl: true },
    }),
  ]);
  const championMap = Object.fromEntries(champions.map((c) => [c.id, c]));

  return (
    <SummonerSearch
      championMap={championMap}
      initial={{
        platform,
        gameName: parsed.gameName,
        tagLine: parsed.tagLine,
      }}
      isLoggedIn={!!session?.user}
    />
  );
}
