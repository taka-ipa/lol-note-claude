"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Lane } from "@/lib/lane";

export async function saveMatchupMemo(
  myChampionId: string,
  opponentChampionId: string,
  lane: Lane,
  memo: string
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("ログインしてください");
  }

  await prisma.matchupMemo.upsert({
    where: {
      userId_myChampionId_opponentChampionId_lane: {
        userId,
        myChampionId,
        opponentChampionId,
        lane,
      },
    },
    update: { memo },
    create: { userId, myChampionId, opponentChampionId, lane, memo },
  });

  revalidatePath(`/champions/${myChampionId}`);
  revalidatePath(`/matchup/${myChampionId}/${lane}/${opponentChampionId}`);
}
