import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { parseId } from "../lib/params";
import { sessions, sessionMessages } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import type { Request } from "express";

const router = Router();
type AuthReq = Request & { userId: string };

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { userId } = req as AuthReq;
  const all = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: (s, { desc }) => [desc(s.updatedAt)],
  });
  res.json(all);
});

router.post("/", async (req, res) => {
  const { userId } = req as AuthReq;
  const [created] = await db.insert(sessions).values({ userId }).returning();
  res.status(201).json(created);
});

router.get("/:id", async (req, res) => {
  const { userId } = req as AuthReq;
  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, id), eq(sessions.userId, userId)),
    with: { sessionMessages: { orderBy: (m, { asc }) => [asc(m.createdAt)] } },
  });
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(session);
});

router.delete("/:id", async (req, res) => {
  const { userId } = req as AuthReq;
  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
  res.status(204).send();
});

export default router;
