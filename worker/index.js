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

    if (!env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured on the worker");
      return jsonError("Proxy is not configured", 500, origin);
    }

    // IP rate limiting via KV
    if (env.RATE_LIMITS) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `${ip}:${new Date().toDateString()}`;
      const raw = await env.RATE_LIMITS.get(key);
      const parsed = parseInt(raw || "0", 10);
      const count = Number.isNaN(parsed) ? 0 : parsed;
      if (count >= DAILY_LIMIT) {
        return corsResponse(
          new Response(JSON.stringify({ error: { message: "Daily limit reached. Try again tomorrow." } }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }),
          origin
        );
      }
      try {
        await env.RATE_LIMITS.put(key, String(count + 1), { expirationTtl: 86400 });
      } catch (err) {
        console.error("Failed to record rate-limit usage", err);
      }
    }

    // Proxy to Groq
    let groqRes;
    try {
      const body = await request.text();
      groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body,
      });
    } catch (err) {
      console.error("Upstream Groq request failed", err);
      return jsonError("Upstream provider is unreachable", 502, origin);
    }

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
  return r;
}
