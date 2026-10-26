import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export type ChampionListItem = {
  id: string;
  nameJa: string;
  nameEn: string;
  titleJa: string;
  iconUrl: string;
  tags: string[];
};

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

// チャンピオン一覧(ログイン不要)。Webのチャンプ検索と同じデータを、
// スマホアプリなどWeb画面以外からも取得できるようにするためのAPI。
export async function GET(req: NextRequest) {
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `champions:${getClientIp(req)}`,
    30,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "アクセスが集中しています。少し時間をおいてから再度お試しください。" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const rows = await prisma.champion.findMany({
      orderBy: { nameJa: "asc" },
      select: {
        id: true,
        nameJa: true,
        nameEn: true,
        titleJa: true,
        iconUrl: true,
        tags: true,
      },
    });

    const champions: ChampionListItem[] = rows.map((c) => ({
      ...c,
      tags: parseTags(c.tags),
    }));

    // チャンピオンデータはパッチ更新時にしか変わらないため、1時間キャッシュしてよい。
    return NextResponse.json(
      { champions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "予期しないエラーが発生しました" },
      { status: 500 }
    );
  }
}
