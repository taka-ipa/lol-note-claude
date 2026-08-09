"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLATFORMS, type Platform } from "@/lib/riot";
import { LANE_LABELS, type Lane } from "@/lib/lane";
import {
  QUEUE_LABELS,
  TIER_COLORS,
  formatRank,
  queueLabel,
} from "@/lib/rank";
import { STAT_SHARD_LABELS } from "@/lib/runes";
import {
  addToSearchHistory,
  type SearchHistoryEntry,
} from "@/lib/searchHistory";
import RiotIdInput from "@/components/RiotIdInput";
import type { HistoryMatch, HistoryParticipant } from "@/app/api/riot/history/route";
import type { ParticipantBuild } from "@/app/api/riot/timeline/route";

const SHOPPING_TRIP_GAP_MS = 30_000;

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
  matches: HistoryMatch[];
} & IconMaps;

type BuildState = ParticipantBuild[] | "loading" | "error";

function champIcon(map: Record<string, ChampionInfo>, championName: string) {
  return map[championName];
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
        className="shrink-0 rounded bg-neutral-800"
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
          <div key={i} className="h-[14px] w-[14px] rounded bg-neutral-800" />
        )
      )}
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
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <p className="mb-1 text-xs text-neutral-500">{label}</p>
      <p className={`text-sm font-bold ${colorClass.split(" ")[0]}`}>
        {formatRank(entry.tier, entry.rank)}
      </p>
      <p className="text-xs text-neutral-400">{entry.leaguePoints} LP</p>
      <p className="text-xs text-neutral-500">
        {entry.wins}勝{entry.losses}敗 (勝率{winRate}%)
      </p>
    </div>
  );
}

function ParticipantRow({
  p,
  championMap,
  version,
  icons,
  isMe,
}: {
  p: HistoryParticipant;
  championMap: Record<string, ChampionInfo>;
  version: string;
  icons: IconMaps;
  isMe: boolean;
}) {
  const champ = champIcon(championMap, p.championName);
  const kda = p.deaths === 0 ? "Perfect" : ((p.kills + p.assists) / p.deaths).toFixed(2);
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
        <div className="h-6 w-6 shrink-0 rounded bg-neutral-800" />
      )}
      <SpellRuneCluster p={p} icons={icons} />
      <span
        className={`w-28 truncate ${isMe ? "font-semibold text-white" : "text-neutral-300"}`}
      >
        {champ?.nameJa ?? p.championName}
      </span>
      <span className="w-24 truncate text-neutral-500">
        {p.riotIdGameName}
      </span>
      <span className="w-24 text-neutral-300">
        {p.kills}/{p.deaths}/{p.assists}
        <span className="ml-1 text-neutral-500">({kda})</span>
      </span>
      <span className="w-14 text-neutral-400">CS {p.cs}</span>
      <span className="w-16 text-neutral-400">
        {p.goldEarned.toLocaleString()}g
      </span>
      <span className="w-16 text-neutral-400">
        {p.totalDamageDealtToChampions.toLocaleString()}
      </span>
      <div className="flex gap-0.5">
        {p.items.map((itemId, i) => (
          <ItemIcon key={i} itemId={itemId} version={version} />
        ))}
      </div>
    </div>
  );
}

function RuneDetailRow({
  p,
  championMap,
  icons,
  isMe,
}: {
  p: HistoryParticipant;
  championMap: Record<string, ChampionInfo>;
  icons: IconMaps;
  isMe: boolean;
}) {
  const champ = champIcon(championMap, p.championName);
  const primaryTreeIcon = p.primaryStyle ? icons.styleIcons[p.primaryStyle] : undefined;
  const subTreeIcon = p.subStyle ? icons.styleIcons[p.subStyle] : undefined;
  const shardIds = p.statPerks
    ? [p.statPerks.offense, p.statPerks.flex, p.statPerks.defense]
    : [];

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded px-2 py-1 text-xs ${
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
        <div className="h-6 w-6 shrink-0 rounded bg-neutral-800" />
      )}
      <span
        className={`w-28 shrink-0 truncate ${isMe ? "font-semibold text-white" : "text-neutral-300"}`}
      >
        {champ?.nameJa ?? p.championName}
      </span>

      <div className="flex items-center gap-1">
        {primaryTreeIcon && (
          <Image
            src={primaryTreeIcon}
            alt=""
            width={20}
            height={20}
            unoptimized
            className="shrink-0 rounded bg-neutral-950"
          />
        )}
        {p.primarySelections.map((perkId, i) => {
          const src = icons.perkIcons[perkId];
          return src ? (
            <Image
              key={i}
              src={src}
              alt=""
              width={i === 0 ? 22 : 18}
              height={i === 0 ? 22 : 18}
              unoptimized
              className="shrink-0 rounded-full border border-neutral-700 bg-neutral-950"
            />
          ) : (
            <div key={i} className="h-[18px] w-[18px] shrink-0 rounded-full bg-neutral-800" />
          );
        })}
      </div>

      <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
        {subTreeIcon && (
          <Image
            src={subTreeIcon}
            alt=""
            width={18}
            height={18}
            unoptimized
            className="shrink-0 rounded bg-neutral-950"
          />
        )}
        {p.subSelections.map((perkId, i) => {
          const src = icons.perkIcons[perkId];
          return src ? (
            <Image
              key={i}
              src={src}
              alt=""
              width={18}
              height={18}
              unoptimized
              className="shrink-0 rounded-full border border-neutral-700 bg-neutral-950"
            />
          ) : (
            <div key={i} className="h-[18px] w-[18px] shrink-0 rounded-full bg-neutral-800" />
          );
        })}
      </div>

      {shardIds.length > 0 && (
        <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
          {shardIds.map((id, i) => (
            <span
              key={i}
              className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300"
            >
              {STAT_SHARD_LABELS[id] ?? id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BuildOrderRow({
  p,
  championMap,
  version,
  build,
  isMe,
}: {
  p: HistoryParticipant;
  championMap: Record<string, ChampionInfo>;
  version: string;
  build: ParticipantBuild | undefined;
  isMe: boolean;
}) {
  const champ = champIcon(championMap, p.championName);
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
        <div className="h-6 w-6 shrink-0 rounded bg-neutral-800" />
      )}
      <span
        className={`w-28 shrink-0 truncate ${isMe ? "font-semibold text-white" : "text-neutral-300"}`}
      >
        {champ?.nameJa ?? p.championName}
      </span>
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1">
        {(build?.items ?? []).map((item, i, items) => {
          const prev = items[i - 1];
          const isNewTrip =
            i > 0 && prev && item.timestamp - prev.timestamp > SHOPPING_TRIP_GAP_MS;
          return (
            <Fragment key={i}>
              {isNewTrip && (
                <span className="shrink-0 px-0.5 text-neutral-600">→</span>
              )}
              <ItemIcon itemId={item.itemId} version={version} size={20} />
            </Fragment>
          );
        })}
        {build && build.items.length === 0 && (
          <span className="text-neutral-500">購入記録なし</span>
        )}
      </div>
    </div>
  );
}

function MatchDetail({
  match,
  championMap,
  version,
  icons,
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
  myPuuid: string;
  tab: "overview" | "build";
  onTabChange: (tab: "overview" | "build") => void;
  buildState: BuildState | undefined;
  onRequestBuild: () => void;
}) {
  const blueTeam = match.participants.filter((p) => p.teamId === 100);
  const redTeam = match.participants.filter((p) => p.teamId === 200);

  const buildByPuuid: Record<string, ParticipantBuild> = {};
  if (Array.isArray(buildState)) {
    for (const b of buildState) buildByPuuid[b.puuid] = b;
  }

  return (
    <div className="border-t border-neutral-800 bg-neutral-950/60 p-3">
      <div className="mb-3 flex gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => onTabChange("overview")}
          className={`rounded px-3 py-1 text-xs font-medium ${
            tab === "overview"
              ? "bg-sky-600 text-white"
              : "text-neutral-400 hover:text-white"
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
          className={`rounded px-3 py-1 text-xs font-medium ${
            tab === "build"
              ? "bg-sky-600 text-white"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          ビルド
        </button>
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
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
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "build" && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-bold text-neutral-300">
              アイテムビルド
            </p>
            {buildState === "loading" && (
              <p className="text-xs text-neutral-500">読み込み中...</p>
            )}
            {buildState === "error" && (
              <p className="text-xs text-red-400">
                アイテムビルドの取得に失敗しました
              </p>
            )}
            {Array.isArray(buildState) && (
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-semibold text-sky-400">
                    ブルーチーム
                  </p>
                  <div className="space-y-0.5">
                    {blueTeam.map((p) => (
                      <BuildOrderRow
                        key={p.puuid}
                        p={p}
                        championMap={championMap}
                        version={version}
                        build={buildByPuuid[p.puuid]}
                        isMe={p.puuid === myPuuid}
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
                      <BuildOrderRow
                        key={p.puuid}
                        p={p}
                        championMap={championMap}
                        version={version}
                        build={buildByPuuid[p.puuid]}
                        isMe={p.puuid === myPuuid}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-neutral-300">ルーン</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-sky-400">
                  ブルーチーム
                </p>
                <div className="space-y-0.5">
                  {blueTeam.map((p) => (
                    <RuneDetailRow
                      key={p.puuid}
                      p={p}
                      championMap={championMap}
                      icons={icons}
                      isMe={p.puuid === myPuuid}
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
                    <RuneDetailRow
                      key={p.puuid}
                      p={p}
                      championMap={championMap}
                      icons={icons}
                      isMe={p.puuid === myPuuid}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type InitialSearch = { platform: Platform; gameName: string; tagLine: string };

export default function SummonerSearch({
  championMap,
  hero = false,
  initial,
}: {
  championMap: Record<string, ChampionInfo>;
  hero?: boolean;
  initial?: InitialSearch;
}) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? "jp1");
  const [searchedPlatform, setSearchedPlatform] = useState<Platform | null>(
    null
  );
  const [riotId, setRiotId] = useState(
    initial ? `${initial.gameName}#${initial.tagLine}` : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchTab, setMatchTab] = useState<Record<string, "overview" | "build">>(
    {}
  );
  const [buildCache, setBuildCache] = useState<Record<string, BuildState>>({});

  async function runSearch(p: Platform, gameName: string, tagLine: string) {
    setLoading(true);
    setError(null);
    setData(null);
    setExpandedMatchId(null);
    setMatchTab({});
    setBuildCache({});
    try {
      const res = await fetch(
        `/api/riot/history?platform=${p}&gameName=${encodeURIComponent(
          gameName
        )}&tagLine=${encodeURIComponent(tagLine)}&count=20`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "検索に失敗しました");
        return;
      }
      setData(json);
      setSearchedPlatform(p);
      addToSearchHistory({
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

  useEffect(() => {
    if (!initial) return;
    setPlatform(initial.platform);
    setRiotId(`${initial.gameName}#${initial.tagLine}`);
    runSearch(initial.platform, initial.gameName, initial.tagLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.platform, initial?.gameName, initial?.tagLine]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const parts = riotId.split("#");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("「ゲーム名#タグ」の形式で入力してください");
      return;
    }
    const [gameName, tagLine] = parts;
    router.push(summonerUrl(platform, gameName, tagLine));
  }

  function handleSelectSuggestion(entry: SearchHistoryEntry) {
    router.push(summonerUrl(entry.platform, entry.gameName, entry.tagLine));
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

  const showHero = hero && !data;

  return (
    <div>
      {showHero ? (
        <div className="flex flex-col items-center py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            LoL Matchup{" "}
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Note
            </span>
          </h1>
          <p className="mt-3 text-neutral-400">
            サモナー名を検索して、戦績からマッチアップメモへ。
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-2xl items-center gap-0 rounded-full border border-neutral-700 bg-neutral-900 p-1.5 shadow-lg"
          >
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="shrink-0 rounded-full bg-transparent px-4 py-2.5 text-sm text-neutral-300 focus:outline-none"
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
            <span className="h-6 w-px shrink-0 bg-neutral-700" />
            <RiotIdInput
              value={riotId}
              onChange={setRiotId}
              onSelectSuggestion={handleSelectSuggestion}
              platform={platform}
              placeholder="ゲーム名 + #タグ"
              className="min-w-0 w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="検索"
              className="flex shrink-0 items-center justify-center rounded-full bg-sky-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "検索中..." : "検索"}
            </button>
          </form>

          <div className="mt-4 flex gap-3 text-sm">
            <Link href="/champions" className="text-neutral-400 hover:text-sky-400">
              チャンプ検索はこちら →
            </Link>
          </div>

          {error && (
            <div className="mt-6 w-full max-w-2xl rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSearch}
            className="mb-6 flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="mb-1 block text-xs text-neutral-400">
                リージョン
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="max-w-sm flex-1">
              <label className="mb-1 block text-xs text-neutral-400">
                Riot ID (ゲーム名#タグ)
              </label>
              <RiotIdInput
                value={riotId}
                onChange={setRiotId}
                onSelectSuggestion={handleSelectSuggestion}
                platform={platform}
                placeholder="ゲーム名 + #タグ"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "検索中..." : "検索"}
            </button>
          </form>

          {error && (
            <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </>
      )}

      {data && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-4">
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
            <RankCard entry={soloEntry} />
            <RankCard entry={flexEntry} />
            {!soloEntry && !flexEntry && (
              <span className="text-sm text-neutral-500">
                ランク戦のプレイ記録がありません
              </span>
            )}
          </div>

          {(() => {
            const currentPlatform = searchedPlatform ?? platform;
            const fromParam = encodeURIComponent(
              `/summoners/${currentPlatform}/${data.account.gameName}-${data.account.tagLine}`
            );
            return (
          <>
          <div className="space-y-2">
            {data.matches.map((m) => {
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
                  className={`overflow-hidden rounded-lg border-l-4 ${
                    m.win
                      ? "border-sky-500 bg-sky-950/30"
                      : "border-red-500 bg-red-950/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMatchId(isExpanded ? null : m.matchId)
                    }
                    className="flex w-full items-center gap-4 p-3 text-left hover:bg-white/5"
                  >
                    <div className="w-32 shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          m.win ? "text-sky-400" : "text-red-400"
                        }`}
                      >
                        {m.win ? "勝利" : "敗北"}
                      </p>
                      <p className="text-xs text-neutral-500">
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

                    <div className="w-28 shrink-0 text-sm text-neutral-300">
                      <p>
                        {m.kills} / {m.deaths} / {m.assists}
                      </p>
                      <p className="text-xs text-neutral-500">KDA {kda}</p>
                    </div>

                    <div className="w-24 shrink-0 text-xs text-neutral-500">
                      <p>CS {m.cs}</p>
                      <p>{formatDuration(m.gameDuration)}</p>
                    </div>

                    <div className="flex flex-1 items-center justify-end gap-3">
                      {oppChamp && (
                        <div className="flex items-center gap-2 text-neutral-400">
                          <span className="text-xs">vs</span>
                          <Image
                            src={oppChamp.iconUrl}
                            alt={oppChamp.nameJa}
                            width={32}
                            height={32}
                            unoptimized
                            className="rounded-md border border-neutral-700"
                          />
                          <span className="text-sm">{oppChamp.nameJa}</span>
                        </div>
                      )}
                      {myChamp && oppChamp && m.lane && (
                        <Link
                          href={`/matchup/${myChamp.id}/${m.lane}/${oppChamp.id}?from=${fromParam}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
                        >
                          メモを書く
                        </Link>
                      )}
                      <span className="text-neutral-500">
                        {isExpanded ? "▲" : "▼"}
                      </span>
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

          {data.matches.length === 0 && (
            <p className="text-neutral-500">直近の試合が見つかりませんでした</p>
          )}
          </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
