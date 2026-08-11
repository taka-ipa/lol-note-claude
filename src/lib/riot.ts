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

const FRIENDLY_ERROR_MESSAGES: Record<number, string> = {
  400: "リクエストが正しくありません。入力内容を確認してください。",
  401: "Riot APIキーが無効です。管理者に確認してください。",
  403: "Riot APIキーが無効、または有効期限切れです。管理者に確認してください。",
  404: "該当するサモナーが見つかりませんでした。ゲーム名とタグ、リージョンを確認してください。",
  429: "アクセスが集中しています。少し時間をおいてから再度お試しください。",
};

function friendlyRiotErrorMessage(status: number): string {
  if (FRIENDLY_ERROR_MESSAGES[status]) return FRIENDLY_ERROR_MESSAGES[status];
  if (status >= 500) return "Riot API側で問題が発生しています。しばらくしてから再度お試しください。";
  return "Riot APIでエラーが発生しました。しばらくしてから再度お試しください。";
}

async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey() },
    // Riot match data doesn't change once created; cache briefly for account/summoner lookups.
    cache: "no-store",
  });
  if (!res.ok) {
    // Log the raw Riot response server-side for debugging, but never show
    // it to the client — it can include internal error payloads.
    const body = await res.text().catch(() => "");
    console.error(`Riot API error ${res.status} for ${url}: ${body}`);
    throw new RiotApiError(res.status, friendlyRiotErrorMessage(res.status));
  }
  return res.json() as Promise<T>;
}

// Runs `fn` over `items` with at most `limit` calls in flight at once, so a
// single history search doesn't burst past Riot's per-second rate limit
// (e.g. fetching 20 match details for one search).
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
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

export type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export async function getLeagueEntriesByPuuid(
  puuid: string,
  platform: Platform
): Promise<LeagueEntry[]> {
  const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetch<LeagueEntry[]>(url);
}

let cachedDDragonVersion: { version: string; fetchedAt: number } | null = null;

export async function getLatestDDragonVersion(): Promise<string> {
  const ONE_HOUR = 60 * 60 * 1000;
  if (cachedDDragonVersion && Date.now() - cachedDDragonVersion.fetchedAt < ONE_HOUR) {
    return cachedDDragonVersion.version;
  }
  const versions: string[] = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  ).then((r) => r.json());
  const version = versions[0];
  cachedDDragonVersion = { version, fetchedAt: Date.now() };
  return version;
}

export async function getMatchIdsByPuuid(
  puuid: string,
  platform: Platform,
  count = 20,
  queueId?: number
): Promise<string[]> {
  const region = regionalRouteFor(platform);
  const queueParam = queueId ? `&queue=${queueId}` : "";
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}${queueParam}`;
  return riotFetch<string[]>(url);
}

export type MatchParticipant = {
  puuid: string;
  participantId: number;
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
  totalDamageDealtToChampions: number;
  summoner1Id: number;
  summoner2Id: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summonerName: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  perks?: {
    statPerks: { offense: number; flex: number; defense: number };
    styles: {
      description: string;
      style: number;
      selections: { perk: number }[];
    }[];
  };
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

export type TimelineEvent = {
  type: string;
  timestamp: number;
  participantId?: number;
  itemId?: number;
  beforeId?: number;
  afterId?: number;
  skillSlot?: number;
  levelUpType?: string;
};

export type MatchTimelineDto = {
  metadata: { participants: string[] };
  info: {
    frames: { events: TimelineEvent[] }[];
  };
};

export async function getMatchTimeline(
  matchId: string,
  platform: Platform
): Promise<MatchTimelineDto> {
  const region = regionalRouteFor(platform);
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  return riotFetch<MatchTimelineDto>(url);
}

type DDragonSummonerSpell = { key: string; image: { full: string } };

let cachedSpellIconMap: { version: string; map: Record<number, string> } | null =
  null;

export async function getSummonerSpellIconMap(
  version: string
): Promise<Record<number, string>> {
  if (cachedSpellIconMap && cachedSpellIconMap.version === version) {
    return cachedSpellIconMap.map;
  }
  const data: { data: Record<string, DDragonSummonerSpell> } = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`
  ).then((r) => r.json());
  const map: Record<number, string> = {};
  for (const spell of Object.values(data.data)) {
    map[Number(spell.key)] =
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`;
  }
  cachedSpellIconMap = { version, map };
  return map;
}

type DDragonRuneStyle = {
  id: number;
  icon: string;
  slots: { runes: { id: number; icon: string }[] }[];
};

export type RuneTree = {
  id: number;
  icon: string;
  slots: { runes: { id: number; icon: string }[] }[];
};

let cachedRuneIconMaps: {
  version: string;
  perkIcons: Record<number, string>;
  styleIcons: Record<number, string>;
  trees: RuneTree[];
} | null = null;

export async function getRuneIconMaps(version: string): Promise<{
  perkIcons: Record<number, string>;
  styleIcons: Record<number, string>;
  trees: RuneTree[];
}> {
  if (cachedRuneIconMaps && cachedRuneIconMaps.version === version) {
    return cachedRuneIconMaps;
  }
  const styles: DDragonRuneStyle[] = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`
  ).then((r) => r.json());
  const perkIcons: Record<number, string> = {};
  const styleIcons: Record<number, string> = {};
  const trees: RuneTree[] = [];
  for (const style of styles) {
    const styleIconUrl = `https://ddragon.leagueoflegends.com/cdn/img/${style.icon}`;
    styleIcons[style.id] = styleIconUrl;
    const slots = style.slots.map((slot) => ({
      runes: slot.runes.map((rune) => {
        const iconUrl = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
        perkIcons[rune.id] = iconUrl;
        return { id: rune.id, icon: iconUrl };
      }),
    }));
    trees.push({ id: style.id, icon: styleIconUrl, slots });
  }
  cachedRuneIconMaps = { version, perkIcons, styleIcons, trees };
  return cachedRuneIconMaps;
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
