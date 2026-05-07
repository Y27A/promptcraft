const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const MODEL = "llama-3.3-70b-versatile";

export const SYSTEM_PROMPT = `You are PromptCraft AI — an elite prompt engineer who crafts world-class prompts for AI tools like ChatGPT, Claude, and Gemini.

Rules:
1. ALWAYS generate immediately — never ask clarifying questions first.
2. After generating, ask ONE follow-up: "Would you like to adjust anything?"
3. Apply requested changes and regenerate until satisfied.

Always output TWO versions with these exact headings:

### Version 1: Detailed
This must be a LONG, EXTREMELY DETAILED prompt of 600–1000 words. Write every section as full paragraphs — not bullet labels. Include ALL of:
- Role & Persona: 5–8 sentences. Vivid, specific identity with background, expertise, and mindset.
- Task Instructions: Step-by-step paragraphs. Cover every sub-task explicitly.
- Context: Who is the audience, what platform, what constraints, what prior knowledge to assume.
- Output Format: Exact structure — headers, lengths, markdown rules, examples of the format.
- Constraints & Goals: What to avoid, what to prioritize, accuracy requirements, edge cases.
- Tone & Style: 3–4 descriptors + a reference sentence showing the voice.
- Worked Example: A complete before/after or sample output demonstrating the prompt in action.
- Edge Cases & Fallbacks: What to do when the request is ambiguous, incomplete, or unusual.

### Version 2: Concise
A sharp, focused prompt of 80–150 words capturing the core intent only. No extra sections.

Format each inside a markdown code block under its heading. After both versions, write 2 sentences explaining the key difference between them.`;

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
    body: JSON.stringify({ model: MODEL, stream: true, messages }),
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
