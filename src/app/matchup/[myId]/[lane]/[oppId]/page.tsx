import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LANES, LANE_LABELS, type Lane } from "@/lib/lane";
import MemoEditor from "@/components/MemoEditor";

export default async function MatchupPage({
  params,
}: {
  params: Promise<{ myId: string; lane: string; oppId: string }>;
}) {
  const { myId, lane, oppId } = await params;

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
      <Link
        href={`/champions/${myChampion.id}`}
        className="mb-4 inline-block text-sm text-neutral-400 hover:text-white"
      >
        ← {myChampion.nameJa} のマッチアップ一覧に戻る
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <Image
          src={myChampion.iconUrl}
          alt={myChampion.nameJa}
          width={64}
          height={64}
          unoptimized
          className="rounded-lg border border-neutral-700"
        />
        <span className="text-xl text-neutral-500">vs</span>
        <Image
          src={opponentChampion.iconUrl}
          alt={opponentChampion.nameJa}
          width={64}
          height={64}
          unoptimized
          className="rounded-lg border border-neutral-700"
        />
        <div>
          <h1 className="text-xl font-bold text-white">
            {myChampion.nameJa} vs {opponentChampion.nameJa}
          </h1>
          <p className="text-sm text-sky-400">
            {LANE_LABELS[lane as Lane]}
          </p>
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
