import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { templates, userTemplates } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { z } from "zod";
import { getUserId } from "../types/auth";

// Public curated templates
const router = Router();

router.get("/", async (_req, res) => {
  res.json(await db.query.templates.findMany());
});

router.get("/:id", async (req, res) => {
  const t = await db.query.templates.findFirst({ where: eq(templates.id, parseInt(req.params.id)) });
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(t);
});

// User templates router (auth required)
const userRouter = Router();

const templateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  content: z.string().min(1),
  exampleOutput: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  tags: z.array(z.string()).default([]),
});

userRouter.use(requireAuth);

userRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  res.json(await db.query.userTemplates.findMany({ where: eq(userTemplates.userId, userId) }));
});

userRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const body = templateSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [created] = await db.insert(userTemplates).values({ ...body.data, userId }).returning();
  res.status(201).json(created);
});

userRouter.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  const t = await db.query.userTemplates.findFirst({
    where: and(eq(userTemplates.id, id), eq(userTemplates.userId, userId)),
  });
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(t);
});

userRouter.put("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  const body = templateSchema.partial().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const [updated] = await db
    .update(userTemplates)
    .set({ ...body.data, updatedAt: new Date() })
    .where(and(eq(userTemplates.id, id), eq(userTemplates.userId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

userRouter.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = parseInt(req.params.id);
  await db.delete(userTemplates).where(and(eq(userTemplates.id, id), eq(userTemplates.userId, userId)));
  res.status(204).send();
});

export { userRouter as userTemplatesRouter };
export default router;
