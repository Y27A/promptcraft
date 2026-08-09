import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userSettings } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { getOrCreateSettings } from "../lib/usage";
import type { Request } from "express";
import { getUserId } from "../types/auth";

const router = Router();

router.use(requireAuth);

async function requireAdmin(req: Request, res: any, next: any) {
  const userId = getUserId(req);
  const s = await getOrCreateSettings(userId);
  if (!s.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  next();
}

router.use(requireAdmin);

router.get("/users", async (_req, res) => {
  const all = await db.query.userSettings.findMany();
  res.json(all);
});

router.patch("/users/:userId/tier", async (req, res) => {
  const { tier } = z.object({ tier: z.enum(["free", "pro", "unlimited"]) }).parse(req.body);
  const [updated] = await db
    .update(userSettings)
    .set({ tier, updatedAt: new Date() })
    .where(eq(userSettings.userId, req.params.userId))
    .returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

export default router;
