"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PLATFORMS, type Platform } from "@/lib/riot";
import { LANE_LABELS, type Lane } from "@/lib/lane";
import type { HistoryMatch } from "@/app/api/riot/history/route";

type ChampionInfo = { id: string; nameJa: string; iconUrl: string };

type HistoryResponse = {
  account: { puuid: string; gameName: string; tagLine: string };
  summoner: { profileIconId: number; summonerLevel: number } | null;
  matches: HistoryMatch[];
};

function champIcon(map: Record<string, ChampionInfo>, championName: string) {
  return map[championName];
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

export default function SummonerSearch({
  championMap,
}: {
  championMap: Record<string, ChampionInfo>;
}) {
  const [platform, setPlatform] = useState<Platform>("jp1");
  const [riotId, setRiotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistoryResponse | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const parts = riotId.split("#");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("「ゲーム名#タグ」の形式で入力してください (例: さば#khan3)");
      return;
    }
    const [gameName, tagLine] = parts;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `/api/riot/history?platform=${platform}&gameName=${encodeURIComponent(
          gameName
        )}&tagLine=${encodeURIComponent(tagLine)}&count=20`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "検索に失敗しました");
        return;
      }
      setData(json);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
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
        <div className="flex-1">
          <label className="mb-1 block text-xs text-neutral-400">
            Riot ID (ゲーム名#タグ)
          </label>
          <input
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="さば#khan3"
            className="w-full max-w-sm rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
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

      {data && (
        <div>
          <div className="mb-4 flex items-baseline gap-2">
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

              return (
                <div
                  key={m.matchId}
                  className={`flex items-center gap-4 rounded-lg border-l-4 p-3 ${
                    m.win
                      ? "border-sky-500 bg-sky-950/30"
                      : "border-red-500 bg-red-950/20"
                  }`}
                >
                  <div className="w-20 shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        m.win ? "text-sky-400" : "text-red-400"
                      }`}
                    >
                      {m.win ? "勝利" : "敗北"}
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
                        href={`/matchup/${myChamp.id}/${m.lane}/${oppChamp.id}`}
                        className="shrink-0 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
                      >
                        メモを書く
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {data.matches.length === 0 && (
            <p className="text-neutral-500">直近の試合が見つかりませんでした</p>
          )}
        </div>
      )}
    </div>
  );
}
