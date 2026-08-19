"use client";

import { useEffect, useState } from "react";
import type { Platform } from "@/lib/riot";
import {
  filterHistory,
  type SearchHistoryEntry,
} from "@/lib/searchHistory";

export default function RiotIdInput({
  gameName,
  tagLine,
  onGameNameChange,
  onTagLineChange,
  onSelectSuggestion,
  platform,
  history,
  placeholder = "ゲーム名#タグ",
  className,
}: {
  gameName: string;
  tagLine: string;
  onGameNameChange: (value: string) => void;
  onTagLineChange: (value: string) => void;
  onSelectSuggestion: (entry: SearchHistoryEntry) => void;
  platform: Platform;
  history: SearchHistoryEntry[];
  placeholder?: string;
  className: string;
}) {
  const [focused, setFocused] = useState(false);
  // The raw text the user is typing. Kept as local state (rather than always
  // deriving `${gameName}#${tagLine}`) because that derivation collapses
  // back to just `gameName` while tagLine is still empty — e.g. right after
  // typing "#" with nothing after it yet — making "#" seem impossible to type.
  const [rawValue, setRawValue] = useState(() =>
    tagLine ? `${gameName}#${tagLine}` : gameName
  );

  // Re-sync when gameName/tagLine change from outside this input (selecting
  // a suggestion, navigating to a different summoner, etc.) without clobbering
  // in-progress typing that produces the same gameName/tagLine pair.
  useEffect(() => {
    const idx = rawValue.indexOf("#");
    const currentGameName = idx === -1 ? rawValue : rawValue.slice(0, idx);
    const currentTagLine = idx === -1 ? "" : rawValue.slice(idx + 1);
    if (currentGameName !== gameName || currentTagLine !== tagLine) {
      setRawValue(tagLine ? `${gameName}#${tagLine}` : gameName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameName, tagLine]);

  const suggestions = focused ? filterHistory(history, gameName) : [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setRawValue(v);
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
        value={rawValue}
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
                className="flex w-full items-center justify-between px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-800"
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
