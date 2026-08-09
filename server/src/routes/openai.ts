import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { sessions, sessionMessages } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { reserveUserGenSlot, decrementUserGenCount } from "../lib/usage";
import OpenAI from "openai";
import { z } from "zod";
import type { Request } from "express";
import { logger } from "../lib/logger";
import { parseIdParam } from "../lib/params";
import { failStream } from "../lib/stream";

const router = Router();
type AuthReq = Request & { userId: string };

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

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
  const { userId } = req as AuthReq;
  const sessionId = parseIdParam(req.params.id, "session id");

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId)),
  });
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const body = bodySchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const reserved = await reserveUserGenSlot(userId);
  if (!reserved) { res.status(429).json({ error: "quota_exhausted" }); return; }

  // Save user message
  await db.insert(sessionMessages).values({
    sessionId,
    role: "user",
    content: body.data.content,
  });

  // Auto-title from first message
  if (!session.title) {
    await db.update(sessions).set({
      title: body.data.content.slice(0, 60),
      updatedAt: new Date(),
    }).where(eq(sessions.id, sessionId));
  }

  // Build system prompt with addons
  let sysPrompt = SYSTEM_PROMPT;
  if (body.data.mode === "advanced") {
    sysPrompt += "\n\nAdvanced mode: reference prompt engineering principles (chain-of-thought, few-shot, role prompting) and explain your design choices briefly.";
  } else if (body.data.mode === "beginner") {
    sysPrompt += "\n\nBeginner mode: use plain language and explain any technical terms you use.";
  }
  if (body.data.domain || body.data.style) {
    const parts = [];
    if (body.data.domain) parts.push(`domain: ${body.data.domain}`);
    if (body.data.style) parts.push(`tone: ${body.data.style}`);
    sysPrompt += `\n\nThe user wants this prompt for ${parts.join(", ")}.`;
  }

  const history = await db.query.sessionMessages.findMany({
    where: eq(sessionMessages.sessionId, sessionId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";
  try {
    const stream = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: true,
      messages: [
        { role: "system", content: sysPrompt },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(sessionMessages).values({ sessionId, role: "assistant", content: fullContent });
    await db.update(sessions).set({ updatedAt: new Date() }).where(eq(sessions.id, sessionId));
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    logger.error({ err, userId, sessionId }, "Generation stream failed");
    try {
      await decrementUserGenCount(userId);
    } catch (refundErr) {
      logger.error({ err: refundErr, userId }, "Failed to refund generation quota");
    }
    if (fullContent) {
      try {
        await db.insert(sessionMessages).values({ sessionId, role: "assistant", content: fullContent });
      } catch (saveErr) {
        logger.error({ err: saveErr, sessionId }, "Failed to persist partial assistant message");
      }
    }
    failStream(res, "Generation failed");
  }
});

export default router;
