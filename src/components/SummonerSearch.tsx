"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLATFORMS, type Platform } from "@/lib/riot";
import { LANES, LANE_LABELS, type Lane } from "@/lib/lane";
import {
  QUEUE_LABELS,
  TIER_COLORS,
  formatRank,
  queueLabel,
} from "@/lib/rank";
import { STAT_SHARD_ICON_URLS } from "@/lib/statShards";
import { RANK_EMBLEM_URLS } from "@/lib/rankEmblems";
import {
  addToSearchHistory,
  getSearchHistory,
  type SearchHistoryEntry,
} from "@/lib/searchHistory";
import {
  addSearchHistoryDb,
  getSearchHistoryDb,
} from "@/lib/searchHistoryActions";
import {
  MAIN_TABS,
  DROPDOWN_TABS,
  RANKED_QUEUE_IDS,
  categoryOf,
  type QueueCategoryId,
} from "@/lib/queueCategories";
import RiotIdInput from "@/components/RiotIdInput";
import Spinner from "@/components/Spinner";
import type { HistoryMatch, HistoryParticipant } from "@/app/api/riot/history/route";
import type { BuildItem, ParticipantBuild } from "@/app/api/riot/timeline/route";
import type { RuneTree } from "@/lib/riot";

const SHOPPING_TRIP_GAP_MS = 30_000;
const LOAD_MORE_STEPS = [20, 40, 50];

type ChampionInfo = { id: string; nameJa: string; iconUrl: string };

type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type IconMaps = {
  spellIcons: Record<number, string>;
  perkIcons: Record<number, string>;
  styleIcons: Record<number, string>;
};

type HistoryResponse = {
  account: { puuid: string; gameName: string; tagLine: string };
  summoner: { profileIconId: number; summonerLevel: number } | null;
  rankedEntries: LeagueEntry[];
  ddragonVersion: string;
  runeTrees: RuneTree[];
  matches: HistoryMatch[];
} & IconMaps;

type BuildState = ParticipantBuild[] | "loading" | "error";

function champIcon(map: Record<string, ChampionInfo>, championName: string) {
  return map[championName];
}

type ChampionStat = {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  avgCsPerMin: number;
};

function computeChampionStats(matches: HistoryMatch[]): ChampionStat[] {
  const totals = new Map<
    string,
    {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      csPerMinSum: number;
    }
  >();
  for (const m of matches) {
    const cur = totals.get(m.championName) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      csPerMinSum: 0,
    };
    cur.games += 1;
    if (m.win) cur.wins += 1;
    cur.kills += m.kills;
    cur.deaths += m.deaths;
    cur.assists += m.assists;
    cur.csPerMinSum += m.cs / (m.gameDuration / 60);
    totals.set(m.championName, cur);
  }
  return Array.from(totals.entries())
    .map(([championName, v]) => ({
      championName,
      games: v.games,
      wins: v.wins,
      losses: v.games - v.wins,
      winRate: Math.round((v.wins / v.games) * 100),
      avgKills: v.kills / v.games,
      avgDeaths: v.deaths / v.games,
      avgAssists: v.assists / v.games,
      kda: v.deaths === 0 ? Infinity : (v.kills + v.assists) / v.deaths,
      avgCsPerMin: v.csPerMinSum / v.games,
    }))
    .sort((a, b) => b.games - a.games);
}

function formatKda(kda: number) {
  return kda === Infinity ? "Perfect" : `${kda.toFixed(2)}:1`;
}

const EMPTY_LANE_COUNTS: Record<Lane, number> = {
  TOP: 0,
  JUNGLE: 0,
  MID: 0,
  ADC: 0,
  SUPPORT: 0,
};

type RecentSummary = {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  champions: ChampionStat[];
  laneCounts: Record<Lane, number>;
};

function computeRecentSummary(
  matches: HistoryMatch[],
  recentCount: number
): RecentSummary {
  const recent = matches.slice(0, recentCount);
  const games = recent.length;
  const wins = recent.filter((m) => m.win).length;
  const kills = recent.reduce((s, m) => s + m.kills, 0);
  const deaths = recent.reduce((s, m) => s + m.deaths, 0);
  const assists = recent.reduce((s, m) => s + m.assists, 0);
  const laneCounts = { ...EMPTY_LANE_COUNTS };
  for (const m of recent) {
    if (m.lane) laneCounts[m.lane] += 1;
  }
  return {
    games,
    wins,
    losses: games - wins,
    winRate: games > 0 ? Math.round((wins / games) * 100) : 0,
    avgKills: games > 0 ? kills / games : 0,
    avgDeaths: games > 0 ? deaths / games : 0,
    avgAssists: games > 0 ? assists / games : 0,
    kda: deaths === 0 ? Infinity : (kills + assists) / deaths,
    champions: computeChampionStats(recent),
    laneCounts,
  };
}

function WinRateDonut({ winRate, size = 76 }: { winRate: number; size?: number }) {
  const radius = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const winLength = (winRate / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f87171" strokeWidth="8" />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="8"
        strokeDasharray={`${winLength} ${circumference - winLength}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="15"
        fontWeight="700"
      >
        {winRate}%
      </text>
    </svg>
  );
}

function getTopLane(
  laneCounts: Record<Lane, number>,
  totalGames: number
): { lane: Lane; pct: number } | null {
  let top: Lane | null = null;
  let max = 0;
  for (const lane of LANES) {
    if (laneCounts[lane] > max) {
      max = laneCounts[lane];
      top = lane;
    }
  }
  if (!top || totalGames === 0) return null;
  return { lane: top, pct: Math.round((max / totalGames) * 100) };
}

const LANE_SHORT_LABELS: Record<Lane, string> = {
  TOP: "TOP",
  JUNGLE: "JG",
  MID: "MID",
  ADC: "ADC",
  SUPPORT: "SUP",
};

function TopLaneBadge({ lane, pct }: { lane: Lane; pct: number }) {
  return (
    <div className="shrink-0 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-center">
      <p className="whitespace-nowrap text-[10px] text-neutral-500">
        好みのポジション
      </p>
      <p className="whitespace-nowrap text-sm font-semibold text-white">
        {LANE_SHORT_LABELS[lane]} <span className="text-sky-400">{pct}%</span>
      </p>
    </div>
  );
}

function RecentChampionBreakdown({
  champions,
  totalGames,
  championMap,
}: {
  champions: ChampionStat[];
  totalGames: number;
  championMap: Record<string, ChampionInfo>;
}) {
  const top = champions.slice(0, 3);
  if (top.length === 0) {
    return <p className="text-xs text-neutral-500">対象試合がありません</p>;
  }
  return (
    <div className="flex flex-nowrap gap-x-5">
      {top.map((c, i) => {
        const champ = champIcon(championMap, c.championName);
        const playRate =
          totalGames > 0 ? Math.round((c.games / totalGames) * 100) : 0;
        return (
          <div
            key={c.championName}
            className={`flex shrink-0 items-center gap-2 ${
              i === 2 ? "hidden sm:flex" : ""
            }`}
          >
            {champ ? (
              <Image
                src={champ.iconUrl}
                alt={champ.nameJa}
                width={32}
                height={32}
                unoptimized
                className="shrink-0 rounded border border-neutral-700"
              />
            ) : (
              <div className="h-8 w-8 shrink-0 rounded bg-neutral-800" />
            )}
            <div className="text-xs whitespace-nowrap">
              <p className="text-neutral-300">
                {playRate}% ({c.games}戦)
              </p>
              <p
                className={c.winRate >= 50 ? "text-sky-400" : "text-neutral-500"}
              >
                {formatKda(c.kda)} KDA
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentFormPanel({
  matches,
  championMap,
}: {
  matches: HistoryMatch[];
  championMap: Record<string, ChampionInfo>;
}) {
  const summary = useMemo(() => computeRecentSummary(matches, 20), [matches]);
  const topLane = useMemo(
    () => getTopLane(summary.laneCounts, summary.games),
    [summary.laneCounts, summary.games]
  );

  if (summary.games === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">最近の試合</h3>

      <div className="flex items-center gap-3 overflow-x-auto">
        <WinRateDonut winRate={summary.winRate} size={64} />
        <div className="shrink-0 text-xs whitespace-nowrap text-neutral-400">
          <p className="text-neutral-300">
            {summary.games}戦 {summary.wins}勝{summary.losses}敗
          </p>
          <p className="text-neutral-300">
            {summary.avgKills.toFixed(1)} / {summary.avgDeaths.toFixed(1)} /{" "}
            {summary.avgAssists.toFixed(1)}
          </p>
          <p>{formatKda(summary.kda)}</p>
        </div>
        {topLane && <TopLaneBadge lane={topLane.lane} pct={topLane.pct} />}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[10px] text-neutral-500">
          直近{summary.games}試合でプレイしたチャンピオン
        </p>
        <div className="overflow-x-auto">
          <RecentChampionBreakdown
            champions={summary.champions}
            totalGames={summary.games}
            championMap={championMap}
          />
        </div>
      </div>
    </div>
  );
}

function summonerUrl(platform: Platform, gameName: string, tagLine: string) {
  return `/summoners/${platform}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatWhen(ts: number) {
  const diffMs = Date.now() - ts;
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "1時間以内";
  if (diffH < 24) return `${diffH}時間前`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}日前`;
}

function ItemIcon({
  itemId,
  version,
  size = 24,
}: {
  itemId: number;
  version: string;
  size?: number;
}) {
  if (!itemId) {
    return (
      <div
        className="shrink-0 rounded border border-neutral-700 bg-neutral-900"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Image
      src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded border border-neutral-700"
    />
  );
}

function SpellRuneCluster({
  p,
  icons,
}: {
  p: HistoryParticipant;
  icons: IconMaps;
}) {
  const spell1 = icons.spellIcons[p.summoner1Id];
  const spell2 = icons.spellIcons[p.summoner2Id];
  const keystonePerk = p.primarySelections[0];
  const keystone = keystonePerk ? icons.perkIcons[keystonePerk] : undefined;
  const subStyle = p.subStyle ? icons.styleIcons[p.subStyle] : undefined;

  return (
    <div className="grid shrink-0 grid-cols-2 gap-0.5">
      {[spell1, spell2, keystone, subStyle].map((src, i) =>
        src ? (
          <Image
            key={i}
            src={src}
            alt=""
            width={14}
            height={14}
            unoptimized
            className="rounded border border-neutral-700 bg-neutral-950"
          />
        ) : (
          <div key={i} className="h-[14px] w-[14px] rounded bg-neutral-950" />
        )
      )}
    </div>
  );
}

// Community Dragon's ranked-emblem PNGs are 16:9 canvases where the crest
// itself only fills a small centered region; measured across all 10 tiers,
// this box safely contains the artwork on every one with a little padding.
const EMBLEM_CROP = { x: 0.35, w: 0.3, y: 0.27, h: 0.4 };

function RankEmblemIcon({ tier, height = 67 }: { tier: string; height?: number }) {
  const src = RANK_EMBLEM_URLS[tier];
  if (!src) return null;
  const width = Math.round((height * EMBLEM_CROP.w * 16) / (EMBLEM_CROP.h * 9));
  const renderedW = Math.round(width / EMBLEM_CROP.w);
  const renderedH = Math.round(height / EMBLEM_CROP.h);
  const left = -Math.round(renderedW * EMBLEM_CROP.x);
  const top = -Math.round(renderedH * EMBLEM_CROP.y);

  return (
    <div className="relative shrink-0 overflow-hidden" style={{ width, height }}>
      <Image
        src={src}
        alt=""
        width={renderedW}
        height={renderedH}
        unoptimized
        className="absolute max-w-none"
        style={{ width: renderedW, height: renderedH, left, top }}
      />
    </div>
  );
}

function RankCard({ entry }: { entry: LeagueEntry | undefined }) {
  const label = entry ? QUEUE_LABELS[entry.queueType] ?? entry.queueType : "";
  if (!entry) return null;
  const games = entry.wins + entry.losses;
  const winRate = games > 0 ? Math.round((entry.wins / games) * 100) : 0;
  const colorClass = TIER_COLORS[entry.tier] ?? "text-neutral-300 border-neutral-600";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-sm">
      <RankEmblemIcon tier={entry.tier} />
      <div>
        <p className="mb-1 text-xs text-neutral-500">{label}</p>
        <p className={`text-sm font-bold ${colorClass.split(" ")[0]}`}>
          {formatRank(entry.tier, entry.rank)}
        </p>
        <p className="text-xs text-neutral-400">{entry.leaguePoints} LP</p>
        <p className="text-xs text-neutral-500">
          {entry.wins}勝{entry.losses}敗 (勝率{winRate}%)
        </p>
      </div>
    </div>
  );
}

function ParticipantRow({
  p,
  championMap,
  version,
  icons,
  isMe,
  maxDamage,
  gameDuration,
}: {
  p: HistoryParticipant;
  championMap: Record<string, ChampionInfo>;
  version: string;
  icons: IconMaps;
  isMe: boolean;
  maxDamage: number;
  gameDuration: number;
}) {
  const champ = champIcon(championMap, p.championName);
  const kda = p.deaths === 0 ? "Perfect" : ((p.kills + p.assists) / p.deaths).toFixed(2);
  const damagePct =
    maxDamage > 0
      ? Math.max(4, Math.round((p.totalDamageDealtToChampions / maxDamage) * 100))
      : 0;
  return (
    <div
      className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
        isMe ? "bg-sky-950/40" : ""
      }`}
    >
      {champ ? (
        <Image
          src={champ.iconUrl}
          alt={champ.nameJa}
          width={24}
          height={24}
          unoptimized
          className="shrink-0 rounded border border-neutral-700"
        />
      ) : (
        <div className="h-6 w-6 shrink-0 rounded bg-neutral-950" />
      )}
      <SpellRuneCluster p={p} icons={icons} />
      <span
        className={`w-24 truncate ${isMe ? "font-semibold text-white" : "text-neutral-300"}`}
      >
        {p.riotIdGameName}
      </span>
      <span className="w-24 text-neutral-300">
        {p.kills}/{p.deaths}/{p.assists}
        <span className="ml-1 text-neutral-500">({kda})</span>
      </span>
      <span className="w-24 text-neutral-400">
        CS {p.cs} ({(p.cs / (gameDuration / 60)).toFixed(1)}/分)
      </span>
      <span className="w-16 text-neutral-400">
        {p.goldEarned.toLocaleString()}g
      </span>
      <span className="w-24 shrink-0">
        <span className="relative block h-3 w-full overflow-hidden rounded bg-neutral-950">
          <span
            className="absolute inset-y-0 left-0 rounded bg-red-500/70"
            style={{ width: `${damagePct}%` }}
          />
        </span>
        <span className="text-[10px] text-neutral-400">
          {p.totalDamageDealtToChampions.toLocaleString()}
        </span>
      </span>
      <div className="flex gap-0.5">
        {p.items.map((itemId, i) => (
          <ItemIcon key={i} itemId={itemId} version={version} />
        ))}
      </div>
    </div>
  );
}

function ParticipantHeaderRow() {
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-medium text-neutral-500">
      <div className="h-6 w-6 shrink-0" />
      <div className="grid shrink-0 grid-cols-2 gap-0.5">
        <div className="h-[14px] w-[14px]" />
        <div className="h-[14px] w-[14px]" />
        <div className="h-[14px] w-[14px]" />
        <div className="h-[14px] w-[14px]" />
      </div>
      <span className="w-24 truncate">サモナー名</span>
      <span className="w-24">K/D/A (KDA)</span>
      <span className="w-24">CS</span>
      <span className="w-16">ゴールド</span>
      <span className="w-24">与ダメージ</span>
      <span>アイテム</span>
    </div>
  );
}

const SKILL_SLOT_LETTER: Record<number, string> = { 1: "Q", 2: "W", 3: "E", 4: "R" };

type ChampionAbilities = { q: string; w: string; e: string; r: string };
const abilityCache = new Map<string, ChampionAbilities>();

function useChampionAbilities(
  championName: string,
  version: string
): ChampionAbilities | null {
  const cacheKey = `${version}:${championName}`;
  const [abilities, setAbilities] = useState<ChampionAbilities | null>(
    abilityCache.get(cacheKey) ?? null
  );

  useEffect(() => {
    const cached = abilityCache.get(cacheKey);
    if (cached) {
      setAbilities(cached);
      return;
    }
    let cancelled = false;
    fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championName}.json`
    )
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const d = json.data?.[championName];
        if (!d) return;
        const spellUrl = (file: string) =>
          `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${file}`;
        const result: ChampionAbilities = {
          q: spellUrl(d.spells[0].image.full),
          w: spellUrl(d.spells[1].image.full),
          e: spellUrl(d.spells[2].image.full),
          r: spellUrl(d.spells[3].image.full),
        };
        abilityCache.set(cacheKey, result);
        setAbilities(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cacheKey, championName, version]);

  return abilities;
}

function SkillOrderSection({
  skills,
  abilities,
}: {
  skills: { slot: number; timestamp: number }[];
  abilities: ChampionAbilities | null;
}) {
  if (!abilities) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Spinner className="h-3 w-3" />
        読み込み中...
      </p>
    );
  }
  if (skills.length === 0) {
    return <p className="text-xs text-neutral-500">記録がありません</p>;
  }

  const slotIcon = (slot: number) =>
    slot === 1 ? abilities.q : slot === 2 ? abilities.w : slot === 3 ? abilities.e : abilities.r;

  const firstPickIndex = new Map<number, number>();
  skills.forEach((s, i) => {
    if (!firstPickIndex.has(s.slot)) firstPickIndex.set(s.slot, i);
  });
  const priorityOrder = [1, 2, 3]
    .filter((slot) => firstPickIndex.has(slot))
    .sort((a, b) => firstPickIndex.get(a)! - firstPickIndex.get(b)!);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {priorityOrder.map((slot, i) => (
          <Fragment key={slot}>
            {i > 0 && <span className="text-xs text-neutral-600">&gt;</span>}
            <Image
              src={slotIcon(slot)}
              alt={SKILL_SLOT_LETTER[slot]}
              width={28}
              height={28}
              unoptimized
              className="rounded border border-neutral-700"
            />
          </Fragment>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {skills.map((s, i) => (
          <div
            key={i}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
              s.slot === 4
                ? "bg-sky-600 text-white"
                : "bg-neutral-950 text-neutral-300"
            }`}
          >
            {SKILL_SLOT_LETTER[s.slot]}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuneIcon({
  src,
  size,
  selected,
}: {
  src: string;
  size: number;
  selected: boolean;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 rounded-full ${
        selected
          ? "border-2 border-sky-400 bg-neutral-950"
          : "opacity-30 grayscale"
      }`}
    />
  );
}

function RunePageSection({
  me,
  runeTrees,
}: {
  me: HistoryParticipant;
  runeTrees: RuneTree[];
}) {
  const primaryTree = runeTrees.find((t) => t.id === me.primaryStyle);
  const subTree = runeTrees.find((t) => t.id === me.subStyle);
  const shardIds = me.statPerks
    ? [me.statPerks.offense, me.statPerks.flex, me.statPerks.defense]
    : [];

  return (
    <div className="flex flex-wrap items-start gap-4 sm:gap-6">
      {primaryTree && (
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-medium text-neutral-500">メイン</span>
          <Image
            src={primaryTree.icon}
            alt=""
            width={26}
            height={26}
            unoptimized
            className="shrink-0"
          />
          {primaryTree.slots.map((slot, rowIdx) => (
            <div key={rowIdx} className="flex gap-2">
              {slot.runes.map((rune) => (
                <RuneIcon
                  key={rune.id}
                  src={rune.icon}
                  size={rowIdx === 0 ? 36 : 26}
                  selected={me.primarySelections.includes(rune.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {subTree && (
        <div className="flex flex-col items-center gap-3 border-t border-neutral-700 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-1">
          <span className="text-[10px] font-medium text-neutral-500">サブ</span>
          <Image
            src={subTree.icon}
            alt=""
            width={22}
            height={22}
            unoptimized
            className="shrink-0"
          />
          {subTree.slots.slice(1).map((slot, rowIdx) => (
            <div key={rowIdx} className="flex gap-2">
              {slot.runes.map((rune) => (
                <RuneIcon
                  key={rune.id}
                  src={rune.icon}
                  size={24}
                  selected={me.subSelections.includes(rune.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {shardIds.length > 0 && (
        <div className="flex flex-col items-center gap-3 border-t border-neutral-700 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-1">
          <span className="text-[10px] font-medium text-neutral-500">
            ステータス
          </span>
          {shardIds.map((id, i) => {
            const src = STAT_SHARD_ICON_URLS[id];
            return src ? (
              <Image
                key={i}
                src={src}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="shrink-0 rounded-full border border-neutral-700 bg-neutral-950 p-0.5"
              />
            ) : (
              <div
                key={i}
                className="h-5 w-5 shrink-0 rounded-full bg-neutral-950"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyItemTimeline({
  build,
  version,
}: {
  build: ParticipantBuild | undefined;
  version: string;
}) {
  if (!build) return null;
  if (build.items.length === 0) {
    return <p className="text-xs text-neutral-500">購入記録なし</p>;
  }

  const trips: BuildItem[][] = [];
  for (const item of build.items) {
    const trip = trips[trips.length - 1];
    const last = trip?.[trip.length - 1];
    if (trip && last && item.timestamp - last.timestamp <= SHOPPING_TRIP_GAP_MS) {
      trip.push(item);
    } else {
      trips.push([item]);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      {trips.map((trip, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="mt-4 text-neutral-700">›</span>}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              {trip.map((item, j) => (
                <ItemIcon key={j} itemId={item.itemId} version={version} size={24} />
              ))}
            </div>
            <span className="text-[10px] text-neutral-500">
              {Math.floor(trip[0].timestamp / 60000)}分
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function MyBuildPanel({
  me,
  version,
  runeTrees,
  buildState,
}: {
  me: HistoryParticipant;
  version: string;
  runeTrees: RuneTree[];
  buildState: BuildState | undefined;
}) {
  const abilities = useChampionAbilities(me.championName, version);
  const myBuild = Array.isArray(buildState)
    ? buildState.find((b) => b.puuid === me.puuid)
    : undefined;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold text-neutral-300">
          アイテムビルド
        </p>
        {buildState === "loading" && (
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Spinner className="h-3 w-3" />
            読み込み中...
          </p>
        )}
        {buildState === "error" && (
          <p className="text-xs text-red-400">
            アイテムビルドの取得に失敗しました
          </p>
        )}
        {Array.isArray(buildState) && (
          <MyItemTimeline build={myBuild} version={version} />
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-neutral-300">スキル順</p>
        {buildState === "loading" && (
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Spinner className="h-3 w-3" />
            読み込み中...
          </p>
        )}
        {Array.isArray(buildState) && (
          <SkillOrderSection skills={myBuild?.skills ?? []} abilities={abilities} />
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-neutral-300">ルーン</p>
        <RunePageSection me={me} runeTrees={runeTrees} />
      </div>
    </div>
  );
}

function MatchDetail({
  match,
  championMap,
  version,
  icons,
  runeTrees,
  myPuuid,
  tab,
  onTabChange,
  buildState,
  onRequestBuild,
}: {
  match: HistoryMatch;
  championMap: Record<string, ChampionInfo>;
  version: string;
  icons: IconMaps;
  runeTrees: RuneTree[];
  myPuuid: string;
  tab: "overview" | "build";
  onTabChange: (tab: "overview" | "build") => void;
  buildState: BuildState | undefined;
  onRequestBuild: () => void;
}) {
  const blueTeam = match.participants.filter((p) => p.teamId === 100);
  const redTeam = match.participants.filter((p) => p.teamId === 200);
  const me = match.participants.find((p) => p.puuid === myPuuid);
  const maxDamage = Math.max(
    ...match.participants.map((p) => p.totalDamageDealtToChampions),
    1
  );

  return (
    <div className="border-t border-neutral-700 bg-neutral-800 p-3">
      <div className="mb-3 flex gap-2 border-b border-neutral-700 pb-2">
        <button
          type="button"
          onClick={() => onTabChange("overview")}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            tab === "overview"
              ? "bg-sky-600 text-white"
              : "text-neutral-400 hover:bg-neutral-700/50 hover:text-white"
          }`}
        >
          概要
        </button>
        <button
          type="button"
          onClick={() => {
            onTabChange("build");
            onRequestBuild();
          }}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            tab === "build"
              ? "bg-sky-600 text-white"
              : "text-neutral-400 hover:bg-neutral-700/50 hover:text-white"
          }`}
        >
          ビルド
        </button>
      </div>

      {tab === "overview" && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px] space-y-3">
            <ParticipantHeaderRow />
            <div>
              <p className="mb-1 text-xs font-semibold text-sky-400">
                ブルーチーム
              </p>
              <div className="space-y-0.5">
                {blueTeam.map((p) => (
                  <ParticipantRow
                    key={p.puuid}
                    p={p}
                    championMap={championMap}
                    version={version}
                    icons={icons}
                    isMe={p.puuid === myPuuid}
                    maxDamage={maxDamage}
                    gameDuration={match.gameDuration}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-red-400">
                レッドチーム
              </p>
              <div className="space-y-0.5">
                {redTeam.map((p) => (
                  <ParticipantRow
                    key={p.puuid}
                    p={p}
                    championMap={championMap}
                    version={version}
                    icons={icons}
                    isMe={p.puuid === myPuuid}
                    maxDamage={maxDamage}
                    gameDuration={match.gameDuration}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "build" &&
        (me ? (
          <MyBuildPanel
            me={me}
            version={version}
            runeTrees={runeTrees}
            buildState={buildState}
          />
        ) : (
          <p className="text-xs text-neutral-500">
            この試合のデータが見つかりませんでした
          </p>
        ))}
    </div>
  );
}

function SummonerNotFound({
  gameName,
  tagLine,
  platform,
}: {
  gameName: string;
  tagLine: string;
  platform: Platform;
}) {
  const platformLabel =
    PLATFORMS.find((p) => p.value === platform)?.label ?? platform;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-10 text-center">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white">
        <svg viewBox="0 0 36 36" className="h-11 w-11">
          <circle
            cx="15"
            cy="15"
            r="10"
            fill="none"
            stroke="url(#not-found-ring)"
            strokeWidth="2.5"
          />
          <path
            d="M22.5 22.5L31 31"
            stroke="url(#not-found-ring)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M11.5 11.5L18.5 18.5M18.5 11.5L11.5 18.5"
            stroke="#f87171"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="not-found-ring" x1="2" y1="2" x2="31" y2="31">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <p className="text-base font-bold text-white sm:text-lg">
          「{gameName}
          <span className="text-neutral-500">#{tagLine}</span>」が見つかりませんでした
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          {platformLabel}にこのRiot
          IDのプレイヤーが見つかりません。ゲーム名・タグ・リージョンが正しいか、上の検索欄で確認してみてください。
        </p>
      </div>
    </div>
  );
}

type InitialSearch = { platform: Platform; gameName: string; tagLine: string };

export default function SummonerSearch({
  championMap,
  hero = false,
  initial,
  isLoggedIn = false,
}: {
  championMap: Record<string, ChampionInfo>;
  hero?: boolean;
  initial?: InitialSearch;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? "jp1");
  const [searchedPlatform, setSearchedPlatform] = useState<Platform | null>(
    null
  );
  const [gameName, setGameName] = useState(initial?.gameName ?? "");
  const [tagLine, setTagLine] = useState(initial?.tagLine ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchTab, setMatchTab] = useState<Record<string, "overview" | "build">>(
    {}
  );
  const [buildCache, setBuildCache] = useState<Record<string, BuildState>>({});
  const [history, setHistory] = useState<SearchHistoryEntry[]>(() =>
    getSearchHistory()
  );
  const [lastSearched, setLastSearched] = useState<InitialSearch | null>(
    initial ?? null
  );
  const [activeCategory, setActiveCategory] = useState<QueueCategoryId>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rankedCache, setRankedCache] = useState<
    Partial<Record<"solo" | "flex", HistoryMatch[] | "loading" | "error">>
  >({});
  const [allCount, setAllCount] = useState(20);
  const [allLoadingMore, setAllLoadingMore] = useState(false);
  const [rankedCount, setRankedCount] = useState<
    Partial<Record<"solo" | "flex", number>>
  >({});
  const [rankedLoadingMore, setRankedLoadingMore] = useState<
    Partial<Record<"solo" | "flex", boolean>>
  >({});

  async function fetchHistory(
    p: Platform,
    gameName: string,
    tagLine: string,
    count: number,
    queueId?: number
  ) {
    const params = new URLSearchParams({
      platform: p,
      gameName,
      tagLine,
      count: String(count),
    });
    if (queueId) params.set("queueId", String(queueId));
    const res = await fetch(`/api/riot/history?${params.toString()}`);
    const json = await res.json();
    return { ok: res.ok, status: res.status, json };
  }

  async function runSearch(p: Platform, gameName: string, tagLine: string) {
    setLastSearched({ platform: p, gameName, tagLine });
    setActiveCategory("all");
    setDropdownOpen(false);
    setRankedCache({});
    setRankedCount({});
    setAllCount(20);
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    setData(null);
    setExpandedMatchId(null);
    setMatchTab({});
    setBuildCache({});
    try {
      const { ok, status, json } = await fetchHistory(p, gameName, tagLine, 20);
      if (!ok) {
        setError(json.error ?? "検索に失敗しました");
        setErrorStatus(status);
        return;
      }
      setData(json);
      setSearchedPlatform(p);
      recordSearchHistory({
        platform: p,
        gameName: json.account.gameName,
        tagLine: json.account.tagLine,
      });
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function recordSearchHistory(entry: {
    platform: Platform;
    gameName: string;
    tagLine: string;
  }) {
    addToSearchHistory(entry);
    if (isLoggedIn) {
      setHistory((prev) => {
        const withoutDup = prev.filter(
          (e) =>
            !(
              e.platform === entry.platform &&
              e.gameName.toLowerCase() === entry.gameName.toLowerCase() &&
              e.tagLine.toLowerCase() === entry.tagLine.toLowerCase()
            )
        );
        return [{ ...entry, searchedAt: Date.now() }, ...withoutDup].slice(0, 20);
      });
      addSearchHistoryDb(entry).catch(() => {});
    } else {
      setHistory(getSearchHistory());
    }
  }

  async function fetchRankedMatches(category: "solo" | "flex") {
    if (!lastSearched) return;
    setRankedCache((c) => ({ ...c, [category]: "loading" }));
    try {
      const queueId = RANKED_QUEUE_IDS[category];
      const { ok, json } = await fetchHistory(
        lastSearched.platform,
        lastSearched.gameName,
        lastSearched.tagLine,
        20,
        queueId
      );
      if (!ok) {
        setRankedCache((c) => ({ ...c, [category]: "error" }));
        return;
      }
      setRankedCache((c) => ({ ...c, [category]: json.matches }));
      setRankedCount((c) => ({ ...c, [category]: 20 }));
    } catch {
      setRankedCache((c) => ({ ...c, [category]: "error" }));
    }
  }

  async function loadMoreAll() {
    if (!lastSearched) return;
    const idx = LOAD_MORE_STEPS.indexOf(allCount);
    const nextCount = LOAD_MORE_STEPS[idx + 1];
    if (!nextCount) return;
    setAllLoadingMore(true);
    try {
      const { ok, json } = await fetchHistory(
        lastSearched.platform,
        lastSearched.gameName,
        lastSearched.tagLine,
        nextCount
      );
      if (ok) {
        setData(json);
        setAllCount(nextCount);
      }
    } catch {
      // 既存の一覧はそのまま残す
    } finally {
      setAllLoadingMore(false);
    }
  }

  async function loadMoreRanked(category: "solo" | "flex") {
    if (!lastSearched) return;
    const current = rankedCount[category] ?? 20;
    const idx = LOAD_MORE_STEPS.indexOf(current);
    const nextCount = LOAD_MORE_STEPS[idx + 1];
    if (!nextCount) return;
    setRankedLoadingMore((c) => ({ ...c, [category]: true }));
    try {
      const queueId = RANKED_QUEUE_IDS[category];
      const { ok, json } = await fetchHistory(
        lastSearched.platform,
        lastSearched.gameName,
        lastSearched.tagLine,
        nextCount,
        queueId
      );
      if (ok) {
        setRankedCache((c) => ({ ...c, [category]: json.matches }));
        setRankedCount((c) => ({ ...c, [category]: nextCount }));
      }
    } catch {
      // 既存の一覧はそのまま残す
    } finally {
      setRankedLoadingMore((c) => ({ ...c, [category]: false }));
    }
  }

  useEffect(() => {
    if (!initial) return;
    setPlatform(initial.platform);
    setGameName(initial.gameName);
    setTagLine(initial.tagLine);
    runSearch(initial.platform, initial.gameName, initial.tagLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.platform, initial?.gameName, initial?.tagLine]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getSearchHistoryDb().then((dbHistory) => {
      if (dbHistory.length > 0) setHistory(dbHistory);
    });
  }, [isLoggedIn]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmedGameName = gameName.trim();
    const trimmedTagLine = tagLine.trim().replace(/^#/, "");
    if (!trimmedGameName || !trimmedTagLine) {
      setError("ゲーム名とタグの両方を入力してください");
      setErrorStatus(null);
      return;
    }
    router.push(summonerUrl(platform, trimmedGameName, trimmedTagLine));
  }

  function handleSelectSuggestion(entry: SearchHistoryEntry) {
    router.push(summonerUrl(entry.platform, entry.gameName, entry.tagLine));
  }

  function handleCategoryClick(id: QueueCategoryId) {
    setActiveCategory(id);
    setDropdownOpen(false);
    if ((id === "solo" || id === "flex") && !rankedCache[id]) {
      fetchRankedMatches(id);
    }
  }

  async function loadBuild(matchId: string) {
    if (buildCache[matchId] || !searchedPlatform) return;
    setBuildCache((c) => ({ ...c, [matchId]: "loading" }));
    try {
      const res = await fetch(
        `/api/riot/timeline?platform=${searchedPlatform}&matchId=${matchId}`
      );
      const json = await res.json();
      if (!res.ok) {
        setBuildCache((c) => ({ ...c, [matchId]: "error" }));
        return;
      }
      setBuildCache((c) => ({ ...c, [matchId]: json.participants }));
    } catch {
      setBuildCache((c) => ({ ...c, [matchId]: "error" }));
    }
  }

  const soloEntry = data?.rankedEntries.find(
    (e) => e.queueType === "RANKED_SOLO_5x5"
  );
  const flexEntry = data?.rankedEntries.find(
    (e) => e.queueType === "RANKED_FLEX_SR"
  );

  const isRankedCategory = activeCategory === "solo" || activeCategory === "flex";
  const rankedState = isRankedCategory
    ? rankedCache[activeCategory as "solo" | "flex"]
    : undefined;
  const categoryLoading = isRankedCategory && rankedState === "loading";
  const categoryError = isRankedCategory && rankedState === "error";
  const displayedMatches: HistoryMatch[] | null = !data
    ? null
    : activeCategory === "all"
    ? data.matches
    : isRankedCategory
    ? Array.isArray(rankedState)
      ? rankedState
      : null
    : data.matches.filter(
        (m) => categoryOf(m.queueId, m.gameMode) === activeCategory
      );

  const currentRankedCount = isRankedCategory
    ? rankedCount[activeCategory as "solo" | "flex"] ?? 20
    : 20;
  const canLoadMore = isRankedCategory
    ? Array.isArray(rankedState) &&
      rankedState.length >= currentRankedCount &&
      LOAD_MORE_STEPS.indexOf(currentRankedCount) < LOAD_MORE_STEPS.length - 1
    : !!data &&
      data.matches.length >= allCount &&
      LOAD_MORE_STEPS.indexOf(allCount) < LOAD_MORE_STEPS.length - 1;
  const loadingMore = isRankedCategory
    ? rankedLoadingMore[activeCategory as "solo" | "flex"] ?? false
    : allLoadingMore;

  const showHero = hero && !data;

  return (
    <div>
      {!isLoggedIn && (
        <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-center text-sm text-neutral-400">
          <p>
            マッチアップメモは、あなただけが見られる個人用のメモです。書く・見るには右上からログインしてください。
          </p>
        </div>
      )}
      {showHero ? (
        <div className="flex flex-col items-center py-10 text-center sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            LoL Matchup{" "}
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Note
            </span>
          </h1>
          <p className="mt-3 px-4 text-neutral-400">
            サモナー名を検索して、戦績からマッチアップメモへ。
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-2xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:border sm:border-neutral-700 sm:bg-neutral-900 sm:p-1.5 sm:shadow-lg"
          >
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-300 transition-colors focus:outline-none sm:w-auto sm:shrink-0 sm:rounded-full sm:border-0 sm:bg-transparent"
            >
              {PLATFORMS.map((p) => (
                <option
                  key={p.value}
                  value={p.value}
                  className="bg-neutral-900 text-white"
                >
                  {p.label}
                </option>
              ))}
            </select>
            <span className="hidden h-6 w-px shrink-0 bg-neutral-700 sm:block" />
            <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 p-1.5 sm:contents">
              <RiotIdInput
                gameName={gameName}
                tagLine={tagLine}
                onGameNameChange={setGameName}
                onTagLineChange={setTagLine}
                onSelectSuggestion={handleSelectSuggestion}
                platform={platform}
                history={history}
                placeholder="サモナーネーム#タグ"
                className="min-w-0 w-full bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none sm:px-4 sm:py-2.5"
              />
              <button
                type="submit"
                disabled={loading}
                aria-label="検索"
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 sm:rounded-full sm:px-6 sm:py-2.5"
              >
                {loading && <Spinner className="h-3.5 w-3.5" />}
                {loading ? "検索中..." : "検索"}
              </button>
            </div>
          </form>

          <div className="mt-4 flex gap-3 text-sm">
            <Link href="/champions" className="text-neutral-400 hover:text-sky-400">
              チャンプ検索はこちら →
            </Link>
          </div>

          {error && (
            <div className="mt-6 w-full max-w-2xl px-4">
              {errorStatus === 404 && lastSearched ? (
                <SummonerNotFound
                  gameName={lastSearched.gameName}
                  tagLine={lastSearched.tagLine}
                  platform={lastSearched.platform}
                />
              ) : (
                <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 px-4 text-left sm:grid-cols-3">
            {[
              {
                title: "サモナーを検索",
                desc: "リージョンとサモナー名#タグを入力して検索します。",
              },
              {
                title: "試合をチェック",
                desc: "戦績一覧から気になる試合をクリックすると詳細が見られます。",
              },
              {
                title: "マッチアップを記録",
                desc: "「メモを書く」から対面チャンピオンへの立ち回りを書き残せます。",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-sm text-neutral-400">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 px-4 text-xs text-neutral-500">
            ※ マッチアップメモは「チャンプ検索」のチャンピオンページからも追加できます。
          </p>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSearch}
            className="mb-6 flex flex-wrap items-end gap-3"
          >
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-xs text-neutral-400">
                リージョン
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-auto"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full flex-1 sm:max-w-sm">
              <label className="mb-1 block text-xs text-neutral-400">
                サモナーネーム / タグ
              </label>
              <RiotIdInput
                gameName={gameName}
                tagLine={tagLine}
                onGameNameChange={setGameName}
                onTagLineChange={setTagLine}
                onSelectSuggestion={handleSelectSuggestion}
                platform={platform}
                history={history}
                placeholder="サモナーネーム#タグ"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50"
            >
              {loading && <Spinner className="h-3.5 w-3.5" />}
              {loading ? "検索中..." : "検索"}
            </button>
          </form>

          {error && (
            <div className="mb-4">
              {errorStatus === 404 && lastSearched ? (
                <SummonerNotFound
                  gameName={lastSearched.gameName}
                  tagLine={lastSearched.tagLine}
                  platform={lastSearched.platform}
                />
              ) : (
                <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {lastSearched && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-neutral-800">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={loading}
              onClick={() => handleCategoryClick(tab.id)}
              className={`border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
                activeCategory === tab.id
                  ? "border-sky-500 text-white"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="relative">
            <button
              type="button"
              disabled={loading}
              onClick={() => setDropdownOpen((o) => !o)}
              className={`flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
                DROPDOWN_TABS.some((t) => t.id === activeCategory)
                  ? "border-sky-500 text-white"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {DROPDOWN_TABS.find((t) => t.id === activeCategory)?.label ??
                "キュータイプ"}
              <span
                className={`text-xs transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {dropdownOpen && (
              <ul className="absolute left-0 top-full z-10 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                {DROPDOWN_TABS.map((tab) => (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(tab.id)}
                      className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-neutral-800 ${
                        activeCategory === tab.id
                          ? "text-sky-400"
                          : "text-neutral-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {(loading || categoryLoading) && (
        <p className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
          <Spinner className="h-4 w-4" />
          読み込み中...
        </p>
      )}
      {categoryError && (
        <p className="mb-4 text-sm text-red-400">
          この条件の戦績取得に失敗しました
        </p>
      )}

      {data && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              {data.summoner && (
                <Image
                  src={`https://ddragon.leagueoflegends.com/cdn/${data.ddragonVersion}/img/profileicon/${data.summoner.profileIconId}.png`}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="shrink-0 rounded-full border border-neutral-700"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {data.account.gameName}
                  <span className="text-neutral-500">
                    #{data.account.tagLine}
                  </span>
                </h2>
                {data.summoner && (
                  <span className="text-sm text-neutral-400">
                    Lv.{data.summoner.summonerLevel}
                  </span>
                )}
              </div>
            </div>
            <RankCard entry={soloEntry} />
            <RankCard entry={flexEntry} />
            {!soloEntry && !flexEntry && (
              <span className="text-sm text-neutral-500">
                ランク戦のプレイ記録がありません
              </span>
            )}
          </div>

          {!categoryLoading && !categoryError && displayedMatches && (
            <RecentFormPanel matches={displayedMatches} championMap={championMap} />
          )}

          {!categoryLoading && !categoryError && displayedMatches && (() => {
            const currentPlatform = searchedPlatform ?? platform;
            const fromParam = encodeURIComponent(
              `/summoners/${currentPlatform}/${data.account.gameName}-${data.account.tagLine}`
            );
            return (
          <>
          <div className="space-y-2">
            {displayedMatches.map((m) => {
              const myChamp = champIcon(championMap, m.championName);
              const oppChamp = m.opponent
                ? champIcon(championMap, m.opponent.championName)
                : null;
              const kda =
                m.deaths === 0
                  ? "Perfect"
                  : ((m.kills + m.assists) / m.deaths).toFixed(2);
              const isExpanded = expandedMatchId === m.matchId;

              return (
                <div
                  key={m.matchId}
                  className={`overflow-hidden rounded-lg border-l-4 shadow-sm transition-shadow hover:shadow-md ${
                    m.win
                      ? "border-sky-400 bg-sky-900/50"
                      : "border-red-400 bg-red-900/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMatchId(isExpanded ? null : m.matchId)
                    }
                    className="flex w-full flex-col gap-2 p-3 text-left transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex items-center gap-3 sm:contents">
                      <div className="w-14 shrink-0 sm:w-32">
                        <p
                          className={`text-sm font-semibold ${
                            m.win ? "text-sky-300" : "text-red-300"
                          }`}
                        >
                          {m.win ? "勝利" : "敗北"}
                        </p>
                        <p className="hidden text-xs text-neutral-500 sm:block">
                          {queueLabel(m.queueId, m.gameMode)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatWhen(m.gameCreation)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {myChamp ? (
                          <Image
                            src={myChamp.iconUrl}
                            alt={myChamp.nameJa}
                            width={40}
                            height={40}
                            unoptimized
                            className="rounded-md border border-neutral-700"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-neutral-800" />
                        )}
                        <div>
                          <p className="text-sm text-white">
                            {myChamp?.nameJa ?? m.championName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {m.lane ? LANE_LABELS[m.lane as Lane] : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:contents">
                      <div className="sm:w-28 sm:shrink-0 text-sm text-neutral-300">
                        <p>
                          {m.kills} / {m.deaths} / {m.assists}
                        </p>
                        <p className="text-xs text-neutral-500">KDA {kda}</p>
                      </div>

                      <div className="sm:w-24 sm:shrink-0 text-xs text-neutral-500">
                        <p>
                          CS {m.cs} ({(m.cs / (m.gameDuration / 60)).toFixed(1)}/分)
                        </p>
                        <p>{formatDuration(m.gameDuration)}</p>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:justify-end">
                      {oppChamp && (
                        <div className="flex min-w-0 items-center gap-2 text-neutral-400">
                          <span className="shrink-0 text-xs">vs</span>
                          <Image
                            src={oppChamp.iconUrl}
                            alt={oppChamp.nameJa}
                            width={32}
                            height={32}
                            unoptimized
                            className="shrink-0 rounded-md border border-neutral-700"
                          />
                          <span className="min-w-0 truncate text-sm sm:max-w-[6rem]">
                            {oppChamp.nameJa}
                          </span>
                        </div>
                      )}
                      <div className="flex shrink-0 items-center gap-3">
                        {isLoggedIn && myChamp && oppChamp && m.lane && (
                          <Link
                            href={`/matchup/${myChamp.id}/${m.lane}/${oppChamp.id}?from=${fromParam}`}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
                          >
                            メモを書く
                          </Link>
                        )}
                        <span
                          className={`text-neutral-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <MatchDetail
                      match={m}
                      championMap={championMap}
                      version={data.ddragonVersion}
                      icons={{
                        spellIcons: data.spellIcons,
                        perkIcons: data.perkIcons,
                        styleIcons: data.styleIcons,
                      }}
                      runeTrees={data.runeTrees}
                      myPuuid={data.account.puuid}
                      tab={matchTab[m.matchId] ?? "overview"}
                      onTabChange={(tab) =>
                        setMatchTab((t) => ({ ...t, [m.matchId]: tab }))
                      }
                      buildState={buildCache[m.matchId]}
                      onRequestBuild={() => loadBuild(m.matchId)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {displayedMatches.length === 0 && (
            <p className="text-neutral-500">この条件の試合が見つかりませんでした</p>
          )}

          {canLoadMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() =>
                isRankedCategory
                  ? loadMoreRanked(activeCategory as "solo" | "flex")
                  : loadMoreAll()
              }
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {loadingMore && <Spinner className="h-3.5 w-3.5" />}
              {loadingMore ? "読み込み中..." : "もっと見る"}
            </button>
          )}
          </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
