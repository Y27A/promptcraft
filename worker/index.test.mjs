import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker from "./index.js";

const ALLOWED = "https://y27a.github.io";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function makeKV(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    get: vi.fn(async (key) => store.get(key) ?? null),
    put: vi.fn(async (key, value) => void store.set(key, value)),
  };
}

const post = (origin = ALLOWED, body = '{"messages":[]}') =>
  new Request("https://proxy.example/", {
    method: "POST",
    headers: { Origin: origin, "CF-Connecting-IP": "1.2.3.4" },
    body,
  });

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response('{"ok":true}', { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("CORS handling", () => {
  it("answers preflight requests with 204 and CORS headers", async () => {
    const req = new Request("https://proxy.example/", { method: "OPTIONS", headers: { Origin: ALLOWED } });
    const res = await worker.fetch(req, {});

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED);
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers preflight even for disallowed origins", async () => {
    const req = new Request("https://proxy.example/", { method: "OPTIONS", headers: { Origin: "https://evil.test" } });
    await expect(worker.fetch(req, {})).resolves.toMatchObject({ status: 204 });
  });

  it("allows the localhost dev origin", async () => {
    const res = await worker.fetch(post("http://localhost:5173"), {});
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });

  it("rejects unknown origins with 403", async () => {
    const res = await worker.fetch(post("https://evil.test"), {});
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects requests without an Origin header", async () => {
    const req = new Request("https://proxy.example/", { method: "POST", body: "{}" });
    await expect(worker.fetch(req, {})).resolves.toMatchObject({ status: 403 });
  });

  it("rejects non-POST methods from allowed origins with 405", async () => {
    const req = new Request("https://proxy.example/", { method: "GET", headers: { Origin: ALLOWED } });
    const res = await worker.fetch(req, {});

    expect(res.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("rate limiting", () => {
  it("skips rate limiting when no KV namespace is bound", async () => {
    const res = await worker.fetch(post(), {});
    expect(res.status).toBe(200);
  });

  it("counts a request per IP and day", async () => {
    const kv = makeKV();
    await worker.fetch(post(), { RATE_LIMITS: kv });

    const key = `1.2.3.4:${new Date().toDateString()}`;
    expect(kv.get).toHaveBeenCalledWith(key);
    expect(kv.put).toHaveBeenCalledWith(key, "1", { expirationTtl: 86400 });
  });

  it("increments an existing counter", async () => {
    const key = `1.2.3.4:${new Date().toDateString()}`;
    const kv = makeKV({ [key]: "4" });

    await worker.fetch(post(), { RATE_LIMITS: kv });
    expect(kv.put).toHaveBeenCalledWith(key, "5", { expirationTtl: 86400 });
  });

  it("returns 429 with CORS headers once the daily limit is reached", async () => {
    const key = `1.2.3.4:${new Date().toDateString()}`;
    const kv = makeKV({ [key]: "50" });

    const res = await worker.fetch(post(), { RATE_LIMITS: kv });

    expect(res.status).toBe(429);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED);
    await expect(res.json()).resolves.toEqual({ error: { message: "Daily limit reached. Try again tomorrow." } });
    expect(kv.put).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses an 'unknown' bucket when the client IP header is missing", async () => {
    const kv = makeKV();
    const req = new Request("https://proxy.example/", { method: "POST", headers: { Origin: ALLOWED }, body: "{}" });

    await worker.fetch(req, { RATE_LIMITS: kv });
    expect(kv.get).toHaveBeenCalledWith(`unknown:${new Date().toDateString()}`);
  });
});

describe("proxying to Groq", () => {
  it("forwards the body with the server-side API key", async () => {
    await worker.fetch(post(ALLOWED, '{"model":"x"}'), { GROQ_API_KEY: "secret" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GROQ_URL);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer secret");
    expect(init.body).toBe('{"model":"x"}');
  });

  it("passes through the upstream status and content type", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 502, headers: { "Content-Type": "text/plain" } }));

    const res = await worker.fetch(post(), {});
    expect(res.status).toBe(502);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    await expect(res.text()).resolves.toBe("boom");
  });

  it("defaults the content type to json when upstream omits it", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const res = await worker.fetch(post(), {});
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("adds CORS headers to the proxied response", async () => {
    const res = await worker.fetch(post(), {});
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED);
  });
});
