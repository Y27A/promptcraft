const DAILY_LIMIT = 50;
const ALLOWED_ORIGINS = ["https://y27a.github.io", "http://localhost:5173"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

    if (request.method === "OPTIONS") {
      return corsResponse(new Response(null, { status: 204 }), origin);
    }

    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // IP rate limiting via KV
    if (env.RATE_LIMITS) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `${ip}:${new Date().toDateString()}`;
      const count = parseInt((await env.RATE_LIMITS.get(key)) || "0");
      if (count >= DAILY_LIMIT) {
        return corsResponse(
          new Response(JSON.stringify({ error: { message: "Daily limit reached. Try again tomorrow." } }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }),
          origin
        );
      }
      await env.RATE_LIMITS.put(key, String(count + 1), { expirationTtl: 86400 });
    }

    // Proxy to Groq
    const body = await request.text();
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

function corsResponse(response, origin) {
  const r = new Response(response.body, response);
  r.headers.set("Access-Control-Allow-Origin", origin);
  r.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  r.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return r;
}
