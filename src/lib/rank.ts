export const TIER_LABELS: Record<string, string> = {
  IRON: "アイアン",
  BRONZE: "ブロンズ",
  SILVER: "シルバー",
  GOLD: "ゴールド",
  PLATINUM: "プラチナ",
  EMERALD: "エメラルド",
  DIAMOND: "ダイヤモンド",
  MASTER: "マスター",
  GRANDMASTER: "グランドマスター",
  CHALLENGER: "チャレンジャー",
};

export const TIER_COLORS: Record<string, string> = {
  IRON: "text-neutral-400 border-neutral-600",
  BRONZE: "text-amber-700 border-amber-800",
  SILVER: "text-slate-300 border-slate-500",
  GOLD: "text-yellow-400 border-yellow-600",
  PLATINUM: "text-teal-300 border-teal-600",
  EMERALD: "text-emerald-400 border-emerald-600",
  DIAMOND: "text-sky-300 border-sky-500",
  MASTER: "text-purple-400 border-purple-600",
  GRANDMASTER: "text-red-400 border-red-600",
  CHALLENGER: "text-cyan-300 border-cyan-500",
};

export const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: "ソロ/デュオ",
  RANKED_FLEX_SR: "フレックス",
};

const NO_DIVISION_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

export function formatRank(tier: string, rank: string): string {
  const label = TIER_LABELS[tier] ?? tier;
  if (NO_DIVISION_TIERS.has(tier)) return label;
  return `${label} ${rank}`;
}

const QUEUE_ID_LABELS: Record<number, string> = {
  400: "ノーマル(ドラフト)",
  420: "ランク(ソロ/デュオ)",
  430: "ノーマル(ブラインド)",
  440: "ランク(フレックス)",
  450: "ARAM",
  700: "クラッシュ",
  900: "URF",
  1700: "アリーナ",
};

export function queueLabel(queueId: number, gameMode: string): string {
  return QUEUE_ID_LABELS[queueId] ?? gameMode;
}
