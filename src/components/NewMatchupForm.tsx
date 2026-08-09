"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LANES, LANE_LABELS } from "@/lib/lane";
import { toKatakana } from "@/lib/kana";

type ChampionOption = {
  id: string;
  nameJa: string;
  nameEn: string;
  iconUrl: string;
};

const SUGGESTION_LIMIT = 8;

export default function NewMatchupForm({
  myChampionId,
  champions,
}: {
  myChampionId: string;
  champions: ChampionOption[];
}) {
  const router = useRouter();
  const [lane, setLane] = useState<(typeof LANES)[number]>("MID");

  const candidates = useMemo(
    () => champions.filter((c) => c.id !== myChampionId),
    [champions, myChampionId]
  );
  const defaultOpponent = candidates[0];

  const [opponentId, setOpponentId] = useState(defaultOpponent?.id ?? "");
  const [query, setQuery] = useState(defaultOpponent?.nameJa ?? "");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = toKatakana(query.trim()).toLowerCase();
    if (!q) return candidates.slice(0, SUGGESTION_LIMIT);
    return candidates
      .filter(
        (c) =>
          c.nameJa.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      )
      .slice(0, SUGGESTION_LIMIT);
  }, [candidates, query]);

  function selectChampion(c: ChampionOption) {
    setOpponentId(c.id);
    setQuery(c.nameJa);
    setFocused(false);
  }

  function resolveOpponentId(): string {
    if (opponentId) return opponentId;
    const q = toKatakana(query.trim()).toLowerCase();
    const exact = candidates.find((c) => c.nameJa.toLowerCase() === q);
    return exact?.id ?? "";
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const id = resolveOpponentId();
        if (!id) return;
        router.push(`/matchup/${myChampionId}/${lane}/${id}`);
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="mb-1 block text-xs text-neutral-400">レーン</label>
        <select
          value={lane}
          onChange={(e) => setLane(e.target.value as (typeof LANES)[number])}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
        >
          {LANES.map((l) => (
            <option key={l} value={l}>
              {LANE_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <label className="mb-1 block text-xs text-neutral-400">
          相手チャンピオン
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpponentId("");
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 100)}
          placeholder="チャンピオン名で検索..."
          className="w-52 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
        />
        {focused && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-10 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
            {suggestions.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectChampion(c);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                >
                  <Image
                    src={c.iconUrl}
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                    className="shrink-0 rounded border border-neutral-700"
                  />
                  {c.nameJa}
                </button>
              </li>
            ))}
          </ul>
        )}
        {focused && query.trim() && suggestions.length === 0 && (
          <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-500 shadow-xl">
            該当するチャンピオンが見つかりません
          </div>
        )}
      </div>
      <button
        type="submit"
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
      >
        メモを書く
      </button>
    </form>
  );
}
