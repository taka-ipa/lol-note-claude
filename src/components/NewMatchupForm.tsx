"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LANES, LANE_LABELS } from "@/lib/lane";

export default function NewMatchupForm({
  myChampionId,
  champions,
}: {
  myChampionId: string;
  champions: { id: string; nameJa: string }[];
}) {
  const router = useRouter();
  const [lane, setLane] = useState<(typeof LANES)[number]>("MID");
  const [opponentId, setOpponentId] = useState(
    champions.find((c) => c.id !== myChampionId)?.id ?? ""
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!opponentId) return;
        router.push(`/matchup/${myChampionId}/${lane}/${opponentId}`);
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
      <div>
        <label className="mb-1 block text-xs text-neutral-400">
          相手チャンピオン
        </label>
        <select
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
        >
          {champions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameJa}
            </option>
          ))}
        </select>
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
