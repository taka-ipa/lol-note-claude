import { NextRequest, NextResponse } from "next/server";
import {
  getLeagueEntriesByPuuid,
  mapWithConcurrency,
  RiotApiError,
  type Platform,
} from "@/lib/riot";

export type ParticipantRank = { tier: string; rank: string } | null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") as Platform | null;
  const puuidsParam = searchParams.get("puuids");

  if (!platform || !puuidsParam) {
    return NextResponse.json(
      { error: "platform, puuids は必須です" },
      { status: 400 }
    );
  }

  const puuids = puuidsParam.split(",").filter(Boolean);

  try {
    const results = await mapWithConcurrency(
      puuids,
      5,
      async (puuid): Promise<[string, ParticipantRank]> => {
        const entries = await getLeagueEntriesByPuuid(puuid, platform).catch(
          () => []
        );
        const best =
          entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ??
          entries.find((e) => e.queueType === "RANKED_FLEX_SR");
        return [puuid, best ? { tier: best.tier, rank: best.rank } : null];
      }
    );

    return NextResponse.json({ ranks: Object.fromEntries(results) });
  } catch (err) {
    if (err instanceof RiotApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "予期しないエラーが発生しました" },
      { status: 500 }
    );
  }
}
