import { NextRequest, NextResponse } from "next/server";
import {
  getAccountByRiotId,
  getMatchById,
  getMatchIdsByPuuid,
  getSummonerByPuuid,
  normalizeLane,
  RiotApiError,
  type Platform,
} from "@/lib/riot";

export type HistoryMatch = {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  win: boolean;
  championId: number;
  championName: string;
  lane: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | null;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number;
  opponent: { championId: number; championName: string } | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") as Platform | null;
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");
  const count = Number(searchParams.get("count") ?? "20");

  if (!platform || !gameName || !tagLine) {
    return NextResponse.json(
      { error: "platform, gameName, tagLine は必須です" },
      { status: 400 }
    );
  }

  try {
    const account = await getAccountByRiotId(gameName, tagLine, platform);
    const [summoner, matchIds] = await Promise.all([
      getSummonerByPuuid(account.puuid, platform).catch(() => null),
      getMatchIdsByPuuid(account.puuid, platform, count),
    ]);

    const matches = await Promise.all(
      matchIds.map(async (matchId): Promise<HistoryMatch | null> => {
        const match = await getMatchById(matchId, platform).catch(() => null);
        if (!match) return null;

        const me = match.info.participants.find(
          (p) => p.puuid === account.puuid
        );
        if (!me) return null;

        const lane = normalizeLane(me.teamPosition);
        const opponentParticipant = lane
          ? match.info.participants.find(
              (p) =>
                p.teamId !== me.teamId &&
                normalizeLane(p.teamPosition) === lane
            )
          : undefined;

        return {
          matchId: match.metadata.matchId,
          gameCreation: match.info.gameCreation,
          gameDuration: match.info.gameDuration,
          gameMode: match.info.gameMode,
          queueId: match.info.queueId,
          win: me.win,
          championId: me.championId,
          championName: me.championName,
          lane,
          kills: me.kills,
          deaths: me.deaths,
          assists: me.assists,
          cs: me.totalMinionsKilled + me.neutralMinionsKilled,
          goldEarned: me.goldEarned,
          opponent: opponentParticipant
            ? {
                championId: opponentParticipant.championId,
                championName: opponentParticipant.championName,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      account,
      summoner,
      matches: matches.filter((m): m is HistoryMatch => m !== null),
    });
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
