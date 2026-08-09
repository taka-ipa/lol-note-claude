export type QueueCategoryId =
  | "all"
  | "solo"
  | "flex"
  | "urf"
  | "normal"
  | "aram"
  | "ai"
  | "clash"
  | "arena"
  | "nexusblitz"
  | "doombots"
  | "other";

export const MAIN_TABS: { id: QueueCategoryId; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "solo", label: "ランク(ソロ/デュオ)" },
  { id: "flex", label: "ランク(フレックス)" },
  { id: "urf", label: "ランダムミッド" },
];

export const DROPDOWN_TABS: { id: QueueCategoryId; label: string }[] = [
  { id: "normal", label: "ノーマル" },
  { id: "aram", label: "ARAM" },
  { id: "ai", label: "AI戦" },
  { id: "clash", label: "Clash" },
  { id: "arena", label: "アリーナ" },
  { id: "nexusblitz", label: "ネクサスブリッツ" },
  { id: "doombots", label: "ドゥームボット" },
  { id: "other", label: "期間限定" },
];

// The two ranked categories are fetched from Riot with an exact `queue`
// filter (see /api/riot/history) instead of client-side matching, since
// the last 20 "all" games often contain few or no ranked games.
export const RANKED_QUEUE_IDS: Record<"solo" | "flex", number> = {
  solo: 420,
  flex: 440,
};

const AI_QUEUE_IDS = new Set([830, 840, 850, 860, 870, 880]);
const NORMAL_QUEUE_IDS = new Set([400, 430, 480, 490]);

export function categoryOf(queueId: number, gameMode: string): QueueCategoryId {
  if (queueId === RANKED_QUEUE_IDS.solo) return "solo";
  if (queueId === RANKED_QUEUE_IDS.flex) return "flex";
  if (gameMode === "URF" || gameMode === "ARURF" || queueId === 900 || queueId === 1900)
    return "urf";
  if (gameMode === "SWIFTPLAY") return "normal";
  if (gameMode === "ARAM" || queueId === 450) return "aram";
  if (gameMode === "CLASSIC" && NORMAL_QUEUE_IDS.has(queueId)) return "normal";
  if (gameMode === "CLASSIC" && AI_QUEUE_IDS.has(queueId)) return "ai";
  if (queueId === 700) return "clash";
  if (gameMode === "CHERRY" || queueId === 1700 || queueId === 1710) return "arena";
  if (gameMode === "NEXUSBLITZ" || queueId === 1300) return "nexusblitz";
  if (gameMode === "DOOMBOTSTEEMO") return "doombots";
  return "other";
}
