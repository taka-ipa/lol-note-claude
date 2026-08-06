"use client";

import { useState, useTransition } from "react";
import { saveMatchupMemo } from "@/lib/actions";
import type { Lane } from "@/lib/lane";

export default function MemoEditor({
  myChampionId,
  opponentChampionId,
  lane,
  initialMemo,
}: {
  myChampionId: string;
  opponentChampionId: string;
  lane: Lane;
  initialMemo: string;
}) {
  const [memo, setMemo] = useState(initialMemo);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function handleSave() {
    startTransition(async () => {
      await saveMatchupMemo(myChampionId, opponentChampionId, lane, memo);
      setSavedAt(Date.now());
    });
  }

  return (
    <div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={16}
        placeholder="レベル帯ごとの立ち回り、警戒すべきスキル、勝ち筋などを書く..."
        className="w-full rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm leading-relaxed text-white placeholder-neutral-600 focus:border-sky-500 focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
        {savedAt && !isPending && (
          <span className="text-xs text-emerald-400">保存しました</span>
        )}
      </div>
    </div>
  );
}
