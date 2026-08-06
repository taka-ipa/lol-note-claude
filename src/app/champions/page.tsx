import { prisma } from "@/lib/prisma";
import ChampionGrid from "@/components/ChampionGrid";

export default async function ChampionsPage() {
  const champions = await prisma.champion.findMany({
    orderBy: { nameJa: "asc" },
    select: {
      id: true,
      nameJa: true,
      nameEn: true,
      titleJa: true,
      iconUrl: true,
      tags: true,
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-white">チャンプ検索</h1>
      <ChampionGrid champions={champions} />
    </div>
  );
}
