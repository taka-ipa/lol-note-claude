import { prisma } from "@/lib/prisma";
import SummonerSearch from "@/components/SummonerSearch";

export default async function Home() {
  const champions = await prisma.champion.findMany({
    select: { id: true, nameJa: true, iconUrl: true },
  });
  const championMap = Object.fromEntries(champions.map((c) => [c.id, c]));

  return <SummonerSearch championMap={championMap} hero />;
}
