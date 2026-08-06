"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Lane } from "@/lib/lane";

export async function saveMatchupMemo(
  myChampionId: string,
  opponentChampionId: string,
  lane: Lane,
  memo: string
) {
  await prisma.matchupMemo.upsert({
    where: {
      myChampionId_opponentChampionId_lane: {
        myChampionId,
        opponentChampionId,
        lane,
      },
    },
    update: { memo },
    create: { myChampionId, opponentChampionId, lane, memo },
  });

  revalidatePath(`/champions/${myChampionId}`);
  revalidatePath(`/matchup/${myChampionId}/${lane}/${opponentChampionId}`);
}
