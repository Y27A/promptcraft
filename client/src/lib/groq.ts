const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const MODEL = "llama-3.3-70b-versatile";

export const SYSTEM_PROMPT = `You are PromptCraft AI — an expert prompt engineer who helps users create powerful, effective prompts for AI tools.

Your approach:
1. Analyze the user's request to understand their goal.
2. ALWAYS generate the prompt immediately — never ask clarifying questions upfront.
3. After generating, ask ONE question: "Would you like to adjust anything?"

Every generated prompt must include: Role & Persona, Task Instructions, Context, Output Format, Constraints & Goals, Tone & Style, Examples, Edge Cases.

Always provide TWO versions:

### Version 1: Detailed
A comprehensive prompt (300–600 words) with all sections fully written out.

### Version 2: Normal
A concise prompt (80–150 words) capturing the core intent.

Format each inside its own markdown block with the heading. After both, write 1–2 sentences on the key difference.`;

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
