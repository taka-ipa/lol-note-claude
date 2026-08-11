"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toKatakana } from "@/lib/kana";

type Champion = {
  id: string;
  nameJa: string;
  nameEn: string;
  titleJa: string;
  iconUrl: string;
  tags: string;
};

export default function ChampionGrid({
  champions,
}: {
  champions: Champion[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = toKatakana(query.trim()).toLowerCase();
    if (!q) return champions;
    return champions.filter(
      (c) =>
        c.nameJa.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [champions, query]);

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        >
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="チャンピオン名で検索..."
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 pl-9 pr-4 text-white placeholder-neutral-500 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/champions/${c.id}`}
            className="group flex flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-neutral-800/70 focus-visible:bg-neutral-800/70 focus-visible:outline-none"
          >
            <Image
              src={c.iconUrl}
              alt={c.nameJa}
              width={64}
              height={64}
              className="rounded-md border border-neutral-700 shadow-sm transition-all group-hover:scale-105 group-hover:border-sky-500 group-hover:shadow-sky-900/40"
              unoptimized
            />
            <span className="text-xs text-neutral-200 group-hover:text-white">
              {c.nameJa}
            </span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-neutral-500">
          該当するチャンピオンが見つかりません
        </p>
      )}
    </div>
  );
}
