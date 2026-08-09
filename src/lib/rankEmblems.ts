const BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem";

// Verified against Community Dragon's ranked-emblem asset directory.
export const RANK_EMBLEM_URLS: Record<string, string> = {
  IRON: `${BASE}/emblem-iron.png`,
  BRONZE: `${BASE}/emblem-bronze.png`,
  SILVER: `${BASE}/emblem-silver.png`,
  GOLD: `${BASE}/emblem-gold.png`,
  PLATINUM: `${BASE}/emblem-platinum.png`,
  EMERALD: `${BASE}/emblem-emerald.png`,
  DIAMOND: `${BASE}/emblem-diamond.png`,
  MASTER: `${BASE}/emblem-master.png`,
  GRANDMASTER: `${BASE}/emblem-grandmaster.png`,
  CHALLENGER: `${BASE}/emblem-challenger.png`,
};
