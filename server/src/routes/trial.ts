import { Router } from "express";
import { z } from "zod";
import { ANON_TRIAL_LIMIT, readTrialCount, writeTrialCount } from "../lib/usage";
import { SYSTEM_PROMPT } from "./openai";
import { buildSystemPrompt, streamCompletionToSSE } from "../lib/ai";
import { startSSE, sendSSE, endSSE } from "../lib/sse";

const router = Router();

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

  const sysPrompt = buildSystemPrompt(SYSTEM_PROMPT, { domain: body.data.domain, style: body.data.style });

  writeTrialCount(res, used + 1);

  startSSE(res);

  try {
    await streamCompletionToSSE(res, [
      { role: "system", content: sysPrompt },
      { role: "user", content: body.data.content },
    ]);
    endSSE(res);
  } catch {
    sendSSE(res, { error: "Generation failed" });
    res.end();
  }
});

export default router;
