export const TIER_LABELS: Record<string, string> = {
  IRON: "Iron",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
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
  480: "スイフトプレイ",
  490: "ノーマル(クイックプレイ)",
  700: "クラッシュ",
  830: "協力対AI(初心者)",
  840: "協力対AI(初級)",
  850: "協力対AI(中級)",
  900: "URF",
  1020: "ワンフォーオール",
  1300: "ネクサスブリッツ",
  1400: "アルティメット呪文書",
  1900: "URF",
  1700: "アリーナ",
  1710: "アリーナ",
};

// Riot reuses/reassigns queueIds for rotating limited-time modes far more
// often than it updates any queueId reference, so a queueId table alone
// goes stale quickly. The match's own gameMode is more reliable for those
// — fall back to it (translated) before resorting to a generic label.
const GAME_MODE_LABELS: Record<string, string> = {
  ARAM: "ARAM",
  URF: "URF",
  ARURF: "URF",
  SWIFTPLAY: "スイフトプレイ",
  ONEFORALL: "ワンフォーオール",
  NEXUSBLITZ: "ネクサスブリッツ",
  ULTBOOK: "アルティメット呪文書",
  CHERRY: "アリーナ",
  TUTORIAL: "チュートリアル",
  PRACTICETOOL: "練習ツール",
  DOOMBOTSTEEMO: "ドゥームボット",
  ODYSSEY: "オデッセイ",
  STARGUARDIAN: "スターガーディアン",
};

export function queueLabel(queueId: number, gameMode: string): string {
  if (QUEUE_ID_LABELS[queueId]) return QUEUE_ID_LABELS[queueId];
  if (GAME_MODE_LABELS[gameMode]) return GAME_MODE_LABELS[gameMode];
  return "期間限定";
}
