import { NextRequest, NextResponse } from "next/server";
import {
  getMatchTimeline,
  RiotApiError,
  type Platform,
} from "@/lib/riot";

export type BuildItem = { itemId: number; timestamp: number };

export type ParticipantBuild = {
  puuid: string;
  participantId: number;
  items: BuildItem[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") as Platform | null;
  const matchId = searchParams.get("matchId");

  if (!platform || !matchId) {
    return NextResponse.json(
      { error: "platform, matchId は必須です" },
      { status: 400 }
    );
  }

  try {
    const timeline = await getMatchTimeline(matchId, platform);
    const puuids = timeline.metadata.participants;

    const builds = new Map<number, BuildItem[]>();
    for (let i = 1; i <= puuids.length; i++) builds.set(i, []);

    for (const frame of timeline.info.frames) {
      for (const event of frame.events) {
        if (!event.participantId) continue;
        const list = builds.get(event.participantId);
        if (!list) continue;

        if (event.type === "ITEM_PURCHASED" && event.itemId) {
          list.push({ itemId: event.itemId, timestamp: event.timestamp });
        } else if (event.type === "ITEM_UNDO" && event.beforeId) {
          const idx = [...list]
            .reverse()
            .findIndex((it) => it.itemId === event.beforeId);
          if (idx !== -1) {
            list.splice(list.length - 1 - idx, 1);
          }
        }
      }
    }

    const participants: ParticipantBuild[] = puuids.map((puuid, i) => ({
      puuid,
      participantId: i + 1,
      items: builds.get(i + 1) ?? [],
    }));

    return NextResponse.json({ participants });
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
