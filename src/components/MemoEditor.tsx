"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [savedMemo, setSavedMemo] = useState(initialMemo);
  const [isPending, startTransition] = useTransition();
  const [showSaved, setShowSaved] = useState(false);

  const isDirty = memo !== savedMemo;

  function handleSave() {
    startTransition(async () => {
      await saveMatchupMemo(myChampionId, opponentChampionId, lane, memo);
      setSavedMemo(memo);
      setShowSaved(true);
    });
  }

  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [showSaved]);

  return (
    <div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={16}
        placeholder="レベル帯ごとの立ち回り、警戒すべきスキル、勝ち筋などを書く..."
        className="w-full rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm leading-relaxed text-white placeholder-neutral-600 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
        <span
          className={`flex items-center gap-1 text-xs text-emerald-400 transition-opacity duration-300 ${
            showSaved && !isPending ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.6 3.6 6.7-6.7a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
          保存しました
        </span>
      </div>
    </div>
  );
}
