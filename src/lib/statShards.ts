const BASE = "https://raw.communitydragon.org/latest/game/assets/perks/statmods";

// Verified against Community Dragon's perks.json iconPath field.
export const STAT_SHARD_ICON_URLS: Record<number, string> = {
  5001: `${BASE}/statmodshealthplusicon.png`,
  5002: `${BASE}/statmodsarmoricon.png`,
  5003: `${BASE}/statmodsmagicresicon.png`,
  5005: `${BASE}/statmodsattackspeedicon.png`,
  5007: `${BASE}/statmodscdrscalingicon.png`,
  5008: `${BASE}/statmodsadaptiveforceicon.png`,
  5010: `${BASE}/statmodsmovementspeedicon.png`,
  5011: `${BASE}/statmodshealthscalingicon.png`,
  5013: `${BASE}/statmodstenacityicon.png`,
};
