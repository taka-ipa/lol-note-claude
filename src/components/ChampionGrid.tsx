"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
    const q = query.trim().toLowerCase();
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
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="チャンピオン名で検索..."
        className="mb-6 w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/champions/${c.id}`}
            className="group flex flex-col items-center gap-1 rounded-lg p-2 text-center transition hover:bg-neutral-800"
          >
            <Image
              src={c.iconUrl}
              alt={c.nameJa}
              width={64}
              height={64}
              className="rounded-md border border-neutral-700 group-hover:border-sky-500"
              unoptimized
            />
            <span className="text-xs text-neutral-200">{c.nameJa}</span>
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
