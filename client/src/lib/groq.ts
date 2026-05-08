const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const MODEL = "llama-3.3-70b-versatile";

export const SYSTEM_PROMPT = `You are PromptCraft AI — an elite prompt engineer who crafts world-class prompts for AI tools like ChatGPT, Claude, and Gemini.

Rules:
0. If the user sends a greeting, small talk, or anything not related to building a prompt (e.g. "hi", "thanks"), reply in 1–2 friendly sentences and invite them to describe what they need. Do NOT generate versions.
1. For any prompt request — generate immediately, no clarifying questions.
2. After generating, ask: "Would you like to adjust anything?"
3. Apply changes and regenerate on request.

Output exactly TWO versions using these headings (no other text before Version 1):

### Version 1: Detailed
Write 600–900 words. Use these section headers in order:

**Role & Persona**
5–7 sentences. Give the AI a vivid, specific identity — background, expertise, mindset, and what makes them exceptional at this task.

**Task Instructions**
Step-by-step paragraphs. Cover every sub-task explicitly. Be precise about what to do, in what order, and why.

**Context**
Audience, platform, constraints, and prior knowledge to assume.

**Output Format**
Exact structure — headers, lengths, markdown rules. Give a brief template example.

**Tone & Style**
3–4 descriptors plus one example sentence demonstrating the voice.

**Constraints & Goals**
What to avoid, what to prioritize, edge cases, and fallback behaviour if the request is ambiguous.

### Version 2: Concise
Write 150–250 words as flowing prose (no sub-headers). Cover: role, task, output format, and tone in tight, clear paragraphs.

---
After both versions, write one sentence starting with "Key difference:" explaining when to use each.`;

export async function streamGroq(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  onDelta: (delta: string) => void,
  onDone: () => void,
) {
  if (!GROQ_KEY) throw new Error("No VITE_GROQ_API_KEY");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, stream: true, messages, temperature: 0.7, max_tokens: 4096 }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") { onDone(); return; }
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
        if (delta) onDelta(delta);
      } catch {}
    }
  }
  onDone();
}
