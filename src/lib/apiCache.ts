import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function getCached<T>(key: string): Promise<T | null> {
  const row = await prisma.riotApiCache.findUnique({ where: { key } });
  if (!row) return null;
  if (row.expiresAt < new Date()) return null;
  return row.payload as T;
}

export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.riotApiCache.upsert({
    where: { key },
    update: { payload: value as Prisma.InputJsonValue, expiresAt },
    create: { key, payload: value as Prisma.InputJsonValue, expiresAt },
  });

  // Opportunistically sweep expired rows so the table doesn't grow forever.
  if (Math.random() < 0.02) {
    await prisma.riotApiCache
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {});
  }
}
