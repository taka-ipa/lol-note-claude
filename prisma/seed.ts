import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type DDragonChampion = {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  image: { full: string };
};

type DDragonChampionResponse = {
  data: Record<string, DDragonChampion>;
};

async function main() {
  const versions: string[] = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  ).then((r) => r.json());
  const version = versions[0];
  console.log(`Using Data Dragon version ${version}`);

  const ja: DDragonChampionResponse = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/ja_JP/champion.json`
  ).then((r) => r.json());
  const en: DDragonChampionResponse = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  ).then((r) => r.json());

  // Data Dragon includes "Jade_"-prefixed pseudo-champion entries for a
  // special game mode; these are not real playable champions to note.
  const champions = Object.values(ja.data).filter(
    (c) => !c.id.startsWith("Jade_")
  );
  console.log(`Fetched ${champions.length} champions`);

  for (const champ of champions) {
    const enChamp = en.data[champ.id];
    await prisma.champion.upsert({
      where: { id: champ.id },
      update: {
        key: Number(champ.key),
        nameEn: enChamp?.name ?? champ.id,
        nameJa: champ.name,
        titleJa: champ.title,
        tags: JSON.stringify(champ.tags),
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
      },
      create: {
        id: champ.id,
        key: Number(champ.key),
        nameEn: enChamp?.name ?? champ.id,
        nameJa: champ.name,
        titleJa: champ.title,
        tags: JSON.stringify(champ.tags),
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
