import OpenAI from "openai";
import type { Response } from "express";
import { sendSSE } from "./sse";

export const MODEL = "llama-3.3-70b-versatile";

export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type PromptContext = { mode?: "beginner" | "advanced"; domain?: string; style?: string };

const MODE_ADDONS: Record<NonNullable<PromptContext["mode"]>, string> = {
  advanced:
    "\n\nAdvanced mode: reference prompt engineering principles (chain-of-thought, few-shot, role prompting) and explain your design choices briefly.",
  beginner: "\n\nBeginner mode: use plain language and explain any technical terms you use.",
};

/** Appends the mode / domain / tone addons a request asked for to `basePrompt`. */
export function buildSystemPrompt(basePrompt: string, ctx: PromptContext): string {
  let prompt = basePrompt;
  if (ctx.mode) prompt += MODE_ADDONS[ctx.mode];
  if (ctx.domain || ctx.style) {
    const parts: string[] = [];
    if (ctx.domain) parts.push(`domain: ${ctx.domain}`);
    if (ctx.style) parts.push(`tone: ${ctx.style}`);
    prompt += `\n\nThe user wants this prompt for ${parts.join(", ")}.`;
  }
  return prompt;
}

/** Streams a completion to the client as SSE frames and resolves with the full text. */
export async function streamCompletionToSSE(res: Response, messages: ChatMessage[]): Promise<string> {
  const stream = await openai.chat.completions.create({ model: MODEL, stream: true, messages });
  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      full += delta;
      sendSSE(res, { content: delta });
    }
  }
  return full;
}
