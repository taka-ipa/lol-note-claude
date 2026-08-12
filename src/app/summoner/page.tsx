import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SummonerSearch from "@/components/SummonerSearch";

export default async function SummonerPage() {
  const [session, champions] = await Promise.all([
    auth(),
    prisma.champion.findMany({
      select: { id: true, nameJa: true, iconUrl: true },
    }),
  ]);
  const championMap = Object.fromEntries(champions.map((c) => [c.id, c]));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-white">サモナー検索</h1>
      <SummonerSearch
        championMap={championMap}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
