const DAILY_LIMIT = 50;
const ALLOWED_ORIGINS = ["https://y27a.github.io", "http://localhost:5173"];
const ALLOWED_MODELS = ["llama-3.3-70b-versatile"];
const MAX_BODY_BYTES = 32 * 1024;
const MAX_TOKENS = 4096;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);

    if (!allowed) {
      return new Response("Forbidden", { status: 403, headers: { Vary: "Origin" } });
    }

    if (request.method === "OPTIONS") {
      return corsResponse(new Response(null, { status: 204 }), origin);
    }

    if (request.method !== "POST") {
      return corsResponse(new Response("Method Not Allowed", { status: 405 }), origin);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonError("Request too large", 413, origin);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return jsonError("Invalid JSON body", 400, origin);
    }

    if (!ALLOWED_MODELS.includes(payload.model)) {
      return jsonError("Unsupported model", 400, origin);
    }
    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return jsonError("Invalid messages", 400, origin);
    }

    // Only forward a known-good set of fields so callers cannot drive the
    // upstream API with arbitrary parameters.
    const body = JSON.stringify({
      model: payload.model,
      messages: payload.messages,
      stream: payload.stream === true,
      temperature: typeof payload.temperature === "number" ? payload.temperature : 0.7,
      max_tokens: Math.min(Number(payload.max_tokens) || MAX_TOKENS, MAX_TOKENS),
    });

    // IP rate limiting via KV
    if (env.RATE_LIMITS) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `${ip}:${new Date().toDateString()}`;
      const count = parseInt((await env.RATE_LIMITS.get(key)) || "0");
      if (count >= DAILY_LIMIT) {
        return jsonError("Daily limit reached. Try again tomorrow.", 429, origin);
      }
      await env.RATE_LIMITS.put(key, String(count + 1), { expirationTtl: 86400 });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body,
    });

    return corsResponse(
      new Response(groqRes.body, {
        status: groqRes.status,
        headers: { "Content-Type": groqRes.headers.get("Content-Type") || "application/json" },
      }),
      origin
    );
  },
};

function jsonError(message, status, origin) {
  return corsResponse(
    new Response(JSON.stringify({ error: { message } }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
    origin
  );
}

function corsResponse(response, origin) {
  const r = new Response(response.body, response);
  r.headers.set("Access-Control-Allow-Origin", origin);
  r.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  r.headers.set("Access-Control-Allow-Headers", "Content-Type");
  r.headers.set("Vary", "Origin");
  return r;
}
