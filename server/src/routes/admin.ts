import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userSettings } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { getOrCreateSettings } from "../lib/usage";
import type { NextFunction, Request, Response } from "express";

const router = Router();
type AuthReq = Request & { userId: string };

router.use(requireAuth);

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { userId } = req as AuthReq;
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
  const body = z.object({ tier: z.enum(["free", "pro", "unlimited"]) }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const { tier } = body.data;
  const [updated] = await db
    .update(userSettings)
    .set({ tier, updatedAt: new Date() })
    .where(eq(userSettings.userId, req.params.userId))
    .returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

export default router;
