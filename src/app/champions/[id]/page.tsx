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
      <Link
        href="/champions"
        className="mb-4 inline-block text-sm text-neutral-400 transition-colors hover:text-white"
      >
        ← チャンプ検索に戻る
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <Image
          src={champion.iconUrl}
          alt={champion.nameJa}
          width={72}
          height={72}
          unoptimized
          className="rounded-lg border border-neutral-700 shadow-lg"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">{champion.nameJa}</h1>
          <p className="text-sm text-neutral-400">{champion.titleJa}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">
          マッチアップを追加
        </h2>
        <NewMatchupForm myChampionId={champion.id} champions={allChampions} />
      </div>

      <div className="space-y-6">
        {memosByLane.map(({ lane, memos }) =>
          memos.length === 0 ? null : (
            <div key={lane}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-400">
                {LANE_LABELS[lane]}
                <span className="text-xs font-normal text-neutral-500">
                  {memos.length}件
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {memos.map((m) => (
                  <Link
                    key={m.id}
                    href={`/matchup/${champion.id}/${m.lane}/${m.opponentChampionId}`}
                    className="group flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3 transition-colors hover:border-sky-500 hover:bg-neutral-800/60"
                  >
                    <Image
                      src={m.opponentChampion.iconUrl}
                      alt={m.opponentChampion.nameJa}
                      width={40}
                      height={40}
                      unoptimized
                      className="shrink-0 rounded-md border border-neutral-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        vs {m.opponentChampion.nameJa}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {m.memo || "(メモ未記入)"}
                      </p>
                    </div>
                    <span className="shrink-0 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
        {memos.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-500">
            まだマッチアップメモがありません。上のフォームから追加してください。
          </p>
        )}
      </div>
    </div>
  );
}
