import type { Platform } from "@/lib/riot";

export type SearchHistoryEntry = {
  platform: Platform;
  gameName: string;
  tagLine: string;
  searchedAt: number;
};

const STORAGE_KEY = "lol-note-search-history";
const MAX_ENTRIES = 20;

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function addToSearchHistory(entry: {
  platform: Platform;
  gameName: string;
  tagLine: string;
}) {
  if (typeof window === "undefined") return;
  const existing = getSearchHistory().filter(
    (e) =>
      !(
        e.platform === entry.platform &&
        e.gameName.toLowerCase() === entry.gameName.toLowerCase() &&
        e.tagLine.toLowerCase() === entry.tagLine.toLowerCase()
      )
  );
  const next: SearchHistoryEntry[] = [
    { ...entry, searchedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — ignore.
  }
}

export function matchByGameName(gameName: string): SearchHistoryEntry[] {
  const q = gameName.trim().toLowerCase();
  // Empty query (e.g. clicking an empty field) shows recent history, newest first.
  if (!q) return getSearchHistory().slice(0, 6);
  return getSearchHistory()
    .filter((e) => e.gameName.toLowerCase().startsWith(q))
    .slice(0, 6);
}
