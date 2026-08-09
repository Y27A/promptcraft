import { Router } from "express";
import { z } from "zod";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db } from "../db/client";
import { prompts } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { getUserId } from "../types/auth";
import { nanoid } from "nanoid";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().default("general"),
  description: z.string().optional(),
  tags: z.array(z.string()).max(5).default([]),
});

router.use(requireAuth);

router.get("/stats", async (req, res) => {
  const userId = getUserId(req);
  const all = await db.query.prompts.findMany({ where: eq(prompts.userId, userId) });
  const byCategory: Record<string, number> = {};
  for (const p of all) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  res.json({
    total: all.length,
    favorites: all.filter((p) => p.isFavorite).length,
    byCategory,
    recent: all.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(0, 5),
  });
});

router.get("/tags", async (req, res) => {
  const userId = getUserId(req);
  const all = await db.query.prompts.findMany({ where: eq(prompts.userId, userId) });
  const tagCount: Record<string, number> = {};
  for (const p of all) {
    for (const t of p.tags ?? []) tagCount[t] = (tagCount[t] ?? 0) + 1;
  }
  res.json(Object.entries(tagCount).map(([tag, count]) => ({ tag, count })));
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  const { category, search, favoritesOnly, tag } = req.query as Record<string, string>;

  let results = await db.query.prompts.findMany({ where: eq(prompts.userId, userId) });

  if (category && category !== "all") results = results.filter((p) => p.category === category);
  if (search) results = results.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()));
  if (favoritesOnly === "true") results = results.filter((p) => p.isFavorite);
  if (tag) results = results.filter((p) => p.tags?.includes(tag));

  res.json(results);
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const body = createSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const tags = [...new Set(body.data.tags.map((t) => t.toLowerCase()))].slice(0, 5);
  const [created] = await db.insert(prompts).values({ ...body.data, tags, userId }).returning();
  res.status(201).json(created);
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  const p = await db.query.prompts.findFirst({ where: and(eq(prompts.id, id), eq(prompts.userId, userId)) });
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(p);
});

router.put("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  const body = createSchema.partial().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const tags = body.data.tags
    ? [...new Set(body.data.tags.map((t) => t.toLowerCase()))].slice(0, 5)
    : undefined;

  const [updated] = await db
    .update(prompts)
    .set({ ...body.data, ...(tags ? { tags } : {}), updatedAt: new Date() })
    .where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  await db.delete(prompts).where(and(eq(prompts.id, id), eq(prompts.userId, userId)));
  res.status(204).send();
});

router.post("/:id/share", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  const shareToken = nanoid(16);
  const [updated] = await db
    .update(prompts)
    .set({ shareToken, updatedAt: new Date() })
    .where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ shareToken });
});

router.delete("/:id/share", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  await db
    .update(prompts)
    .set({ shareToken: null, updatedAt: new Date() })
    .where(and(eq(prompts.id, id), eq(prompts.userId, userId)));
  res.status(204).send();
});

export default router;
