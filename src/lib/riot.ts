export type Platform =
  | "jp1"
  | "kr"
  | "na1"
  | "euw1"
  | "eun1"
  | "br1"
  | "la1"
  | "la2"
  | "oc1"
  | "tr1"
  | "ru"
  | "ph2"
  | "sg2"
  | "th2"
  | "tw2"
  | "vn2";

export type RegionalRoute = "americas" | "asia" | "europe" | "sea";

const PLATFORM_TO_REGIONAL: Record<Platform, RegionalRoute> = {
  jp1: "asia",
  kr: "asia",
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  oc1: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "jp1", label: "日本 (JP)" },
  { value: "kr", label: "韓国 (KR)" },
  { value: "na1", label: "北米 (NA)" },
  { value: "euw1", label: "西欧 (EUW)" },
  { value: "eun1", label: "北欧・東欧 (EUNE)" },
  { value: "br1", label: "ブラジル (BR)" },
  { value: "la1", label: "中南米北 (LAN)" },
  { value: "la2", label: "中南米南 (LAS)" },
  { value: "oc1", label: "オセアニア (OCE)" },
  { value: "tr1", label: "トルコ (TR)" },
  { value: "ru", label: "ロシア (RU)" },
];

export function regionalRouteFor(platform: Platform): RegionalRoute {
  return PLATFORM_TO_REGIONAL[platform];
}

export class RiotApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "RiotApiError";
  }
}

function apiKey(): string {
  const key = process.env.RIOT_API_KEY;
  if (!key) {
    throw new RiotApiError(
      401,
      "RIOT_API_KEY が設定されていません。.env に RIOT_API_KEY を追加してください。"
    );
  }
  return key;
}

async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey() },
    // Riot match data doesn't change once created; cache briefly for account/summoner lookups.
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new RiotApiError(
      res.status,
      `Riot API error ${res.status}: ${body || res.statusText}`
    );
  }
  return res.json() as Promise<T>;
}

export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  platform: Platform
): Promise<RiotAccount> {
  const region = regionalRouteFor(platform);
  const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName
  )}/${encodeURIComponent(tagLine)}`;
  return riotFetch<RiotAccount>(url);
}

export type SummonerDto = {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
};

export async function getSummonerByPuuid(
  puuid: string,
  platform: Platform
): Promise<SummonerDto> {
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch<SummonerDto>(url);
}

export async function getMatchIdsByPuuid(
  puuid: string,
  platform: Platform,
  count = 20
): Promise<string[]> {
  const region = regionalRouteFor(platform);
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
  return riotFetch<string[]>(url);
}

export type MatchParticipant = {
  puuid: string;
  championName: string;
  championId: number;
  teamId: number;
  teamPosition: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  summonerName: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
};

export type MatchDto = {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: MatchParticipant[];
  };
};

export async function getMatchById(
  matchId: string,
  platform: Platform
): Promise<MatchDto> {
  const region = regionalRouteFor(platform);
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  return riotFetch<MatchDto>(url);
}

const LANE_MAP: Record<string, "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT"> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUPPORT",
};

export function normalizeLane(
  teamPosition: string
): "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | null {
  return LANE_MAP[teamPosition] ?? null;
}
