"use client";

import { useState } from "react";
import type { Platform } from "@/lib/riot";
import {
  matchByGameName,
  type SearchHistoryEntry,
} from "@/lib/searchHistory";

export default function RiotIdInput({
  gameName,
  tagLine,
  onGameNameChange,
  onTagLineChange,
  onSelectSuggestion,
  platform,
  placeholder = "ゲーム名#タグ",
  className,
}: {
  gameName: string;
  tagLine: string;
  onGameNameChange: (value: string) => void;
  onTagLineChange: (value: string) => void;
  onSelectSuggestion: (entry: SearchHistoryEntry) => void;
  platform: Platform;
  placeholder?: string;
  className: string;
}) {
  const [focused, setFocused] = useState(false);

  const suggestions = focused ? matchByGameName(gameName) : [];
  const value = tagLine ? `${gameName}#${tagLine}` : gameName;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const idx = v.indexOf("#");
    if (idx === -1) {
      onGameNameChange(v);
      onTagLineChange("");
    } else {
      onGameNameChange(v.slice(0, idx));
      onTagLineChange(v.slice(idx + 1));
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 100)}
        placeholder={placeholder}
        className={className}
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 text-left shadow-xl">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectSuggestion(s);
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
              >
                <span>
                  {s.gameName}
                  <span className="text-neutral-500">#{s.tagLine}</span>
                </span>
                {s.platform !== platform && (
                  <span className="text-xs text-neutral-500">
                    {s.platform.toUpperCase()}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
