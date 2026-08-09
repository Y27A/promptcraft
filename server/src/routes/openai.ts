import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { sessions, sessionMessages } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { reserveUserGenSlot, decrementUserGenCount } from "../lib/usage";
import { z } from "zod";
import { buildSystemPrompt, streamCompletionToSSE } from "../lib/ai";
import { startSSE, sendSSE, endSSE } from "../lib/sse";
import { getUserId } from "../types/auth";

const router = Router();

export const SYSTEM_PROMPT = `You are PromptCraft AI — an expert prompt engineer who helps users create powerful, effective prompts for AI tools.

Your approach:
1. Analyze the user's request to understand their goal.
2. ALWAYS generate the prompt immediately — never ask clarifying questions upfront. Use your best judgment to fill in any gaps and make reasonable assumptions.
3. After generating the prompt, ask ONE concise question: "Would you like to adjust anything — the tone, format, level of detail, or anything else?"
4. If the user wants changes, apply them and present the updated prompt. Continue refining until they are satisfied.

When generating prompts, write EACH section in full — not as a one-liner header but as actual, usable copy that another person could paste straight into ChatGPT, Claude, or Gemini and get great results immediately.

Every generated prompt must include all of the following, written out in full sentences and paragraphs (not just bullet labels):

1. Role & Persona  (3–5 sentences minimum, specific and vivid)
2. Task Instructions  (step-by-step or paragraph form)
3. Context  (audience, platform, constraints)
4. Output Format  (structure, length, formatting rules)
5. Constraints & Goals  (avoid / prioritize / accuracy)
6. Tone & Style  (2–3 adjectives + a reference sentence)
7. Examples  (≥1 worked example or NOT-to-do + corrected)
8. Edge Cases & Fallbacks

Always provide TWO versions of the generated prompt:

### Version 1: Detailed
A comprehensive, long-form prompt (300–600 words inside the prompt block) with all 8 sections fully written out.

### Version 2: Normal
A concise, focused prompt (80–150 words inside the prompt block) that captures the core intent without extra elaboration.

Format each version inside its own markdown code block with its heading ("### Version 1: Detailed" and "### Version 2: Normal") so the user can easily copy either one. After both versions, write 1–2 sentences explaining the key difference between them.

Keep your conversational messages (outside the prompt blocks) concise and encouraging.`;

const bodySchema = z.object({
  content: z.string().min(1),
  mode: z.enum(["beginner", "advanced"]).optional(),
  domain: z.string().optional(),
  style: z.string().optional(),
});

router.post("/sessions/:id/messages", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const sessionId = parseInt(String(req.params.id));

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId)),
  });
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const body = bodySchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const reserved = await reserveUserGenSlot(userId);
  if (!reserved) { res.status(429).json({ error: "quota_exhausted" }); return; }

  // Save user message
  const [userMsg] = await db.insert(sessionMessages).values({
    sessionId,
    role: "user",
    content: body.data.content,
  }).returning();

  // Auto-title from first message
  if (!session.title) {
    await db.update(sessions).set({
      title: body.data.content.slice(0, 60),
      updatedAt: new Date(),
    }).where(eq(sessions.id, sessionId));
  }

  const sysPrompt = buildSystemPrompt(SYSTEM_PROMPT, body.data);

  const history = await db.query.sessionMessages.findMany({
    where: eq(sessionMessages.sessionId, sessionId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  startSSE(res);

  try {
    const fullContent = await streamCompletionToSSE(res, [
      { role: "system", content: sysPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ]);

    await db.insert(sessionMessages).values({ sessionId, role: "assistant", content: fullContent });
    await db.update(sessions).set({ updatedAt: new Date() }).where(eq(sessions.id, sessionId));
    endSSE(res);
  } catch (err) {
    await decrementUserGenCount(userId);
    sendSSE(res, { error: "Generation failed" });
    res.end();
  }
});

export default router;
