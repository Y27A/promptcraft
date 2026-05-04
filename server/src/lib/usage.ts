import { db } from "../db/client";
import { userSettings } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import type { Request, Response } from "express";

export const ANON_TRIAL_LIMIT = 10;
export const FREE_DAILY_LIMIT = 25;
export const PRO_DAILY_LIMIT = 50;
export const UNLIMITED_DAILY_LIMIT = -1;

const COOKIE_NAME = "pc_trial";

export async function getOrCreateSettings(userId: string) {
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(userSettings)
    .values({ userId })
    .returning();
  return created;
}

export async function getDailyLimit(tier: string): Promise<number> {
  switch (tier) {
    case "pro": return PRO_DAILY_LIMIT;
    case "unlimited": return UNLIMITED_DAILY_LIMIT;
    default: return FREE_DAILY_LIMIT;
  }
}

export async function getDailyUsageRow(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const settings = await getOrCreateSettings(userId);

  if (settings.dailyGenPeriod !== today) {
    const [updated] = await db
      .update(userSettings)
      .set({ dailyGenCount: 0, dailyGenPeriod: today, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }
  return settings;
}

export async function reserveUserGenSlot(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const settings = await getDailyUsageRow(userId);
  const limit = await getDailyLimit(settings.tier);

  if (limit === UNLIMITED_DAILY_LIMIT) {
    await db
      .update(userSettings)
      .set({ dailyGenCount: sql`${userSettings.dailyGenCount} + 1`, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
    return true;
  }

  const result = await db
    .update(userSettings)
    .set({
      dailyGenCount: sql`CASE WHEN ${userSettings.dailyGenCount} < ${limit} THEN ${userSettings.dailyGenCount} + 1 ELSE ${userSettings.dailyGenCount} END`,
      dailyGenPeriod: today,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId))
    .returning();

  const updated = result[0];
  const prevCount = settings.dailyGenCount;
  return updated.dailyGenCount > prevCount;
}

export async function decrementUserGenCount(userId: string) {
  await db
    .update(userSettings)
    .set({
      dailyGenCount: sql`GREATEST(${userSettings.dailyGenCount} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

export function readTrialCount(req: Request): number {
  const val = req.signedCookies?.[COOKIE_NAME];
  const n = parseInt(val ?? "0", 10);
  return isNaN(n) ? 0 : n;
}

export function writeTrialCount(res: Response, count: number) {
  res.cookie(COOKIE_NAME, String(count), {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}
