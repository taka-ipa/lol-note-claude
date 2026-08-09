import { NextRequest, NextResponse } from "next/server";
import {
  getAccountByRiotId,
  getLatestDDragonVersion,
  getLeagueEntriesByPuuid,
  getMatchById,
  getMatchIdsByPuuid,
  getRuneIconMaps,
  getSummonerByPuuid,
  getSummonerSpellIconMap,
  normalizeLane,
  RiotApiError,
  type LeagueEntry,
  type Platform,
} from "@/lib/riot";

export type HistoryParticipant = {
  puuid: string;
  participantId: number;
  riotIdGameName: string;
  riotIdTagline: string;
  teamId: number;
  win: boolean;
  championId: number;
  championName: string;
  lane: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | null;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  summoner1Id: number;
  summoner2Id: number;
  primaryStyle: number | null;
  primarySelections: number[];
  subStyle: number | null;
  subSelections: number[];
  statPerks: { offense: number; flex: number; defense: number } | null;
  items: number[];
};

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
  participants: HistoryParticipant[];
};

const LANE_ORDER = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

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
    const [summoner, matchIds, ddragonVersion] = await Promise.all([
      getSummonerByPuuid(account.puuid, platform).catch(() => null),
      getMatchIdsByPuuid(account.puuid, platform, count),
      getLatestDDragonVersion(),
    ]);

    const [rankedEntries, spellIcons, runeIcons] = await Promise.all([
      getLeagueEntriesByPuuid(account.puuid, platform).catch(
        (): LeagueEntry[] => []
      ),
      getSummonerSpellIconMap(ddragonVersion),
      getRuneIconMaps(ddragonVersion),
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

        const participants: HistoryParticipant[] = [...match.info.participants]
          .sort((a, b) => {
            if (a.teamId !== b.teamId) return a.teamId - b.teamId;
            return (
              LANE_ORDER.indexOf(a.teamPosition) -
              LANE_ORDER.indexOf(b.teamPosition)
            );
          })
          .map((p) => {
            const primary = p.perks?.styles?.find(
              (s) => s.description === "primaryStyle"
            );
            const sub = p.perks?.styles?.find(
              (s) => s.description === "subStyle"
            );
            return {
              puuid: p.puuid,
              participantId: p.participantId,
              riotIdGameName: p.riotIdGameName || p.summonerName || "?",
              riotIdTagline: p.riotIdTagline || "",
              teamId: p.teamId,
              win: p.win,
              championId: p.championId,
              championName: p.championName,
              lane: normalizeLane(p.teamPosition),
              kills: p.kills,
              deaths: p.deaths,
              assists: p.assists,
              cs: p.totalMinionsKilled + p.neutralMinionsKilled,
              goldEarned: p.goldEarned,
              totalDamageDealtToChampions: p.totalDamageDealtToChampions,
              summoner1Id: p.summoner1Id,
              summoner2Id: p.summoner2Id,
              primaryStyle: primary?.style ?? null,
              primarySelections: primary?.selections?.map((s) => s.perk) ?? [],
              subStyle: sub?.style ?? null,
              subSelections: sub?.selections?.map((s) => s.perk) ?? [],
              statPerks: p.perks?.statPerks ?? null,
              items: [
                p.item0,
                p.item1,
                p.item2,
                p.item3,
                p.item4,
                p.item5,
                p.item6,
              ],
            };
          });

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
          participants,
        };
      })
    );

    return NextResponse.json({
      account,
      summoner,
      rankedEntries,
      ddragonVersion,
      spellIcons,
      perkIcons: runeIcons.perkIcons,
      styleIcons: runeIcons.styleIcons,
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
