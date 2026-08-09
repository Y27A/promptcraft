import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import {
  sessions,
  sessionMessages,
  sessionFavorites,
  sessionTags,
  messageRatings,
  prompts,
} from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getUserId } from "../types/auth";

const router = Router();

// Public: shared prompt
router.get("/shared/:token", async (req, res) => {
  const p = await db.query.prompts.findFirst({
    where: eq(prompts.shareToken, req.params.token),
  });
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ title: p.title, content: p.content, createdAt: p.createdAt });
});

// Public: gallery
router.get("/gallery", async (_req, res) => {
  const published = await db.query.sessions.findMany({
    where: (s, { isNotNull }) => isNotNull(s.publicSlug),
    with: {
      sessionMessages: {
        orderBy: (m, { desc }) => [desc(m.createdAt)],
        limit: 1,
      },
    },
    orderBy: (s, { desc }) => [desc(s.updatedAt)],
    limit: 100,
  });

  const result = published.map((s) => {
    const lastMsg = s.sessionMessages?.[0];
    const preview = lastMsg ? lastMsg.content.replace(/[#`*]/g, "").slice(0, 240) : "";
    return {
      id: s.id,
      slug: s.publicSlug,
      title: s.title ?? "Untitled",
      preview,
      tags: [] as string[],
      ageMs: Date.now() - (s.updatedAt?.getTime() ?? 0),
      messageCount: 0,
    };
  });

  res.json(result);
});

// Public: session by slug
router.get("/p/:slug", async (req, res) => {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.publicSlug, req.params.slug),
    with: { sessionMessages: { orderBy: (m, { asc }) => [asc(m.createdAt)] } },
  });
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(session);
});

// Auth-required below
router.use(requireAuth);

router.get("/social/mine", async (req, res) => {
  const userId = getUserId(req);
  const favs = await db.query.sessionFavorites.findMany({ where: eq(sessionFavorites.userId, userId) });
  const tags = await db.query.sessionTags.findMany({ where: eq(sessionTags.userId, userId) });
  const tagsBySession: Record<number, string[]> = {};
  for (const t of tags) {
    if (!tagsBySession[t.sessionId]) tagsBySession[t.sessionId] = [];
    tagsBySession[t.sessionId].push(t.tag);
  }
  res.json({ favorites: favs.map((f) => f.sessionId), tagsBySession });
});

router.post("/sessions/:sessionId/messages/:messageId/rate", async (req, res) => {
  const userId = getUserId(req);
  const { rating } = z.object({ rating: z.enum(["up", "down"]) }).parse(req.body);
  const messageId = parseInt(req.params.messageId);
  await db
    .insert(messageRatings)
    .values({ messageId, userId, rating })
    .onConflictDoUpdate({ target: [messageRatings.messageId, messageRatings.userId], set: { rating } });
  res.json({ ok: true });
});

router.get("/sessions/:id/favorite", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  const fav = await db.query.sessionFavorites.findFirst({
    where: and(eq(sessionFavorites.sessionId, sessionId), eq(sessionFavorites.userId, userId)),
  });
  res.json({ isFavorite: !!fav });
});

router.post("/sessions/:id/favorite", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  const existing = await db.query.sessionFavorites.findFirst({
    where: and(eq(sessionFavorites.sessionId, sessionId), eq(sessionFavorites.userId, userId)),
  });
  if (existing) {
    await db.delete(sessionFavorites).where(and(eq(sessionFavorites.sessionId, sessionId), eq(sessionFavorites.userId, userId)));
    res.json({ isFavorite: false });
  } else {
    await db.insert(sessionFavorites).values({ sessionId, userId });
    res.json({ isFavorite: true });
  }
});

router.get("/sessions/:id/tags", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  const tags = await db.query.sessionTags.findMany({
    where: and(eq(sessionTags.sessionId, sessionId), eq(sessionTags.userId, userId)),
  });
  res.json(tags.map((t) => t.tag));
});

router.post("/sessions/:id/tags", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  const { tag } = z.object({ tag: z.string().min(1) }).parse(req.body);
  const existing = await db.query.sessionTags.findMany({
    where: and(eq(sessionTags.sessionId, sessionId), eq(sessionTags.userId, userId)),
  });
  if (existing.length >= 10) { res.status(400).json({ error: "Max 10 tags" }); return; }
  if (existing.some((t) => t.tag === tag)) { res.json({ ok: true }); return; }
  await db.insert(sessionTags).values({ id: nanoid(), sessionId, userId, tag });
  res.json({ ok: true });
});

router.delete("/sessions/:id/tags/:tag", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  await db.delete(sessionTags).where(
    and(eq(sessionTags.sessionId, sessionId), eq(sessionTags.userId, userId), eq(sessionTags.tag, req.params.tag))
  );
  res.status(204).send();
});

router.post("/sessions/:id/publish", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  const publicSlug = nanoid(10);
  await db.update(sessions).set({ publicSlug, updatedAt: new Date() }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  res.json({ publicSlug });
});

router.delete("/sessions/:id/publish", async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(req.params.id);
  await db.update(sessions).set({ publicSlug: null, updatedAt: new Date() }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  res.status(204).send();
});

export default router;
