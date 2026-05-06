import { Router } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { ANON_TRIAL_LIMIT, readTrialCount, writeTrialCount } from "../lib/usage";
import { SYSTEM_PROMPT } from "./openai";

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

router.get("/usage", (req, res) => {
  const used = readTrialCount(req);
  res.json({ used, limit: ANON_TRIAL_LIMIT });
});

const bodySchema = z.object({
  content: z.string().min(1),
  mode: z.enum(["beginner", "advanced"]).optional(),
  domain: z.string().optional(),
  style: z.string().optional(),
});

router.post("/refine", async (req, res) => {
  const used = readTrialCount(req);
  if (used >= ANON_TRIAL_LIMIT) {
    res.status(402).json({ error: "trial_exhausted" });
    return;
  }

  const body = bodySchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  let sysPrompt = SYSTEM_PROMPT;
  if (body.data.domain || body.data.style) {
    const parts = [];
    if (body.data.domain) parts.push(`domain: ${body.data.domain}`);
    if (body.data.style) parts.push(`tone: ${body.data.style}`);
    sysPrompt += `\n\nThe user wants this prompt for ${parts.join(", ")}.`;
  }

  writeTrialCount(res, used + 1);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: true,
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: body.data.content },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
    res.end();
  }
});

export default router;
