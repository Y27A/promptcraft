import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userSettings } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { getOrCreateSettings, getDailyLimit, getDailyUsageRow } from "../lib/usage";
import { getUserId } from "../types/auth";

const router = Router();

const PLANS = [
  {
    tier: "free",
    price: "$0",
    dailyLimit: 25,
    features: ["25 generations/day", "Save & tag prompts", "Share prompts", "Community gallery"],
  },
  {
    tier: "pro",
    price: "$5/month",
    dailyLimit: 50,
    features: ["50 generations/day", "All Free features", "Analytics dashboard", "Priority support"],
  },
  {
    tier: "unlimited",
    price: "$15/month",
    dailyLimit: -1,
    features: ["Unlimited generations", "All Pro features", "Early access to new features"],
  },
];

router.get("/plans", (_req, res) => {
  res.json(PLANS);
});

router.use(requireAuth);

router.get("/settings", async (req, res) => {
  const userId = getUserId(req);
  const s = await getOrCreateSettings(userId);
  res.json({
    themePref: s.themePref,
    defaultTone: s.defaultTone,
    defaultModel: s.defaultModel,
    tier: s.tier,
    isAdmin: s.isAdmin,
  });
});

const updateSchema = z.object({
  themePref: z.enum(["system", "light", "dark"]).optional(),
  defaultTone: z.string().optional(),
  defaultModel: z.string().optional(),
});

router.put("/settings", async (req, res) => {
  const userId = getUserId(req);
  const body = updateSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [updated] = await db
    .update(userSettings)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning();
  res.json(updated);
});

router.get("/subscription", async (req, res) => {
  const userId = getUserId(req);
  const s = await getDailyUsageRow(userId);
  const limit = await getDailyLimit(s.tier);
  res.json({ tier: s.tier, dailyLimit: limit, used: s.dailyGenCount });
});

router.get("/usage", async (req, res) => {
  const userId = getUserId(req);
  const s = await getDailyUsageRow(userId);
  const limit = await getDailyLimit(s.tier);
  res.json({ tier: s.tier, dailyLimit: limit, used: s.dailyGenCount });
});

export default router;
