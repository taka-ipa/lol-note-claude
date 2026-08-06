export const LANES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
export type Lane = (typeof LANES)[number];

export const LANE_LABELS: Record<Lane, string> = {
  TOP: "トップ",
  JUNGLE: "ジャングル",
  MID: "ミッド",
  ADC: "ADC",
  SUPPORT: "サポート",
};
