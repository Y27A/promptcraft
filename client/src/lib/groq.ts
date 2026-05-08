const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const PROXY_URL = import.meta.env.VITE_PROXY_URL as string | undefined;
const MODEL = "llama-3.3-70b-versatile";
// Use proxy (key hidden server-side) or fall back to direct Groq (local dev)
const API_URL = PROXY_URL
  ? `${PROXY_URL.replace(/\/$/, "")}/v1/chat/completions`
  : "https://api.groq.com/openai/v1/chat/completions";

export const SYSTEM_PROMPT = `You are PromptCraft AI — a world-class prompt engineer. You turn plain-English requests into production-ready prompts that consistently produce exceptional AI outputs.

Rules:
0. Greetings or off-topic messages (e.g. "hi", "thanks") → reply in 1–2 friendly sentences and ask what they need. Do NOT generate versions.
1. Any prompt request → generate immediately, no clarifying questions.
2. After generating, ask: "Would you like to adjust anything?"
3. Apply changes and regenerate on request.

Prompt engineering principles to apply in every output:
- Use {curly_brace_variables} for anything the user will customise (e.g. {topic}, {audience}, {product_name})
- Give the AI a specific expert identity — not "you are an assistant" but "you are a senior copywriter at Ogilvy with 15 years..."
- Include chain-of-thought instruction where reasoning matters: "Think through X before writing Y"
- Specify output format exactly — structure, length, headers, what to include/exclude
- Add a worked example for complex tasks (few-shot learning dramatically improves output)
- Anticipate edge cases — tell the AI what to do when input is vague or incomplete

Output exactly TWO versions:

### Version 1: Detailed

Write 700–1000 words using these bold section headers:

**Role & Persona**
6–8 sentences. Specific expert identity with background, years of experience, notable achievements, and mindset. Make it vivid — not generic.

**Task Instructions**
Numbered step-by-step. Every sub-task covered explicitly. Include "think step by step" or chain-of-thought where reasoning helps.

**Context & Audience**
Who is reading the output, what platform, what they already know, what constraints apply.

**Output Format**
Exact structure with a mini template. Specify headers, word counts, markdown usage, what to include and exclude.

**Tone & Style**
3–4 precise descriptors + one example sentence in that voice.

**Worked Example**
A brief before/after OR a sample output snippet showing the prompt in action. This is critical for quality.

**Constraints & Edge Cases**
What to avoid. What to do if input is vague, incomplete, or unusual.

### Version 2: Concise

Write 180–260 words. Start with the role in one punchy sentence. Then cover task, format, and tone in tight paragraphs. Include the key {variables}. No sub-headers — but every word earns its place.

---
After both, write one sentence: "Key difference: [V1 for X, V2 for Y]"`;

export async function streamGroq(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  onDelta: (delta: string) => void,
  onDone: () => void,
) {
  if (!GROQ_KEY) throw new Error("No VITE_GROQ_API_KEY");

  if (!PROXY_URL && !GROQ_KEY) throw new Error("No API key or proxy configured");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(!PROXY_URL && GROQ_KEY ? { Authorization: `Bearer ${GROQ_KEY}` } : {}),
    },
    body: JSON.stringify({ model: MODEL, stream: true, messages, temperature: 0.7, max_tokens: 4096 }),
  });

  if (res.status === 429) throw new Error("Daily limit reached — try again tomorrow");
  if (!res.ok) throw new Error(`Generation failed (${res.status})`);

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
