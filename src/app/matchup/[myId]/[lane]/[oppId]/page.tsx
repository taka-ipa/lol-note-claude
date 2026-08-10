import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LANES, LANE_LABELS, type Lane } from "@/lib/lane";
import MemoEditor from "@/components/MemoEditor";

function safeInternalPath(path: string | undefined): string | null {
  if (!path) return null;
  // Only allow same-origin relative paths under /summoners/ to avoid open redirects.
  if (!/^\/summoners\/[^/]+\/[^/]+$/.test(path)) return null;
  return path;
}

export default async function MatchupPage({
  params,
  searchParams,
}: {
  params: Promise<{ myId: string; lane: string; oppId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { myId, lane, oppId } = await params;
  const { from } = await searchParams;
  const returnTo = safeInternalPath(from);

  if (!LANES.includes(lane as Lane)) notFound();

  const [myChampion, opponentChampion, memo] = await Promise.all([
    prisma.champion.findUnique({ where: { id: myId } }),
    prisma.champion.findUnique({ where: { id: oppId } }),
    prisma.matchupMemo.findUnique({
      where: {
        myChampionId_opponentChampionId_lane: {
          myChampionId: myId,
          opponentChampionId: oppId,
          lane: lane as Lane,
        },
      },
    }),
  ]);

  if (!myChampion || !opponentChampion) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
        {returnTo && (
          <>
            <Link href={returnTo} className="transition-colors hover:text-white">
              ← サモナー戦績に戻る
            </Link>
            <span className="text-neutral-700">·</span>
          </>
        )}
        <Link
          href={`/champions/${myChampion.id}`}
          className="transition-colors hover:text-white"
        >
          ← {myChampion.nameJa} のマッチアップ一覧に戻る
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm">
        <div className="flex shrink-0 items-center gap-3">
          <Image
            src={myChampion.iconUrl}
            alt={myChampion.nameJa}
            width={64}
            height={64}
            unoptimized
            className="rounded-lg border border-neutral-700 shadow-md"
          />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-bold text-neutral-400">
            VS
          </span>
          <Image
            src={opponentChampion.iconUrl}
            alt={opponentChampion.nameJa}
            width={64}
            height={64}
            unoptimized
            className="rounded-lg border border-neutral-700 shadow-md"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">
            {myChampion.nameJa}
            <span className="mx-1.5 font-normal text-neutral-500">vs</span>
            {opponentChampion.nameJa}
          </h1>
          <span className="mt-1.5 inline-block rounded-full bg-sky-950 px-2.5 py-0.5 text-xs font-medium text-sky-400">
            {LANE_LABELS[lane as Lane]}
          </span>
        </div>
      </div>

      <MemoEditor
        myChampionId={myChampion.id}
        opponentChampionId={opponentChampion.id}
        lane={lane as Lane}
        initialMemo={memo?.memo ?? ""}
      />
    </div>
  );
}
