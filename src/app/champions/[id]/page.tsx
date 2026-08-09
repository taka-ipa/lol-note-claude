import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LANES, LANE_LABELS } from "@/lib/lane";
import NewMatchupForm from "@/components/NewMatchupForm";

export default async function ChampionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [champion, allChampions, memos] = await Promise.all([
    prisma.champion.findUnique({ where: { id } }),
    prisma.champion.findMany({
      orderBy: { nameJa: "asc" },
      select: { id: true, nameJa: true, nameEn: true, iconUrl: true },
    }),
    prisma.matchupMemo.findMany({
      where: { myChampionId: id },
      include: { opponentChampion: true },
      orderBy: [{ lane: "asc" }, { updatedAt: "desc" }],
    }),
  ]);

  if (!champion) notFound();

  const memosByLane = LANES.map((lane) => ({
    lane,
    memos: memos.filter((m) => m.lane === lane),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Image
          src={champion.iconUrl}
          alt={champion.nameJa}
          width={72}
          height={72}
          unoptimized
          className="rounded-lg border border-neutral-700"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">{champion.nameJa}</h1>
          <p className="text-sm text-neutral-400">{champion.titleJa}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-300">
          マッチアップを追加
        </h2>
        <NewMatchupForm myChampionId={champion.id} champions={allChampions} />
      </div>

      <div className="space-y-6">
        {memosByLane.map(({ lane, memos }) =>
          memos.length === 0 ? null : (
            <div key={lane}>
              <h3 className="mb-2 text-sm font-semibold text-sky-400">
                {LANE_LABELS[lane]}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {memos.map((m) => (
                  <Link
                    key={m.id}
                    href={`/matchup/${champion.id}/${m.lane}/${m.opponentChampionId}`}
                    className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-sky-500"
                  >
                    <Image
                      src={m.opponentChampion.iconUrl}
                      alt={m.opponentChampion.nameJa}
                      width={40}
                      height={40}
                      unoptimized
                      className="rounded-md border border-neutral-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        vs {m.opponentChampion.nameJa}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {m.memo || "(メモ未記入)"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
        {memos.length === 0 && (
          <p className="text-neutral-500">
            まだマッチアップメモがありません。上のフォームから追加してください。
          </p>
        )}
      </div>
    </div>
  );
}
