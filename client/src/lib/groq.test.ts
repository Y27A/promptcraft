import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Mode } from "./groq";

const MODES: Mode[] = ["quick", "standard", "advanced", "developer", "marketing", "plan", "action"];

async function loadGroq(key: string | undefined) {
  vi.resetModules();
  if (key === undefined) vi.stubEnv("VITE_GK", "");
  else vi.stubEnv("VITE_GK", key);
  return import("./groq");
}

function sseResponse(chunks: string[], init?: ResponseInit) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, init);
}

const delta = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("buildSystemPrompt", () => {
  it.each(MODES)("returns a non-empty prompt for the %s mode", async (mode) => {
    const { buildSystemPrompt } = await loadGroq("secret");
    const prompt = buildSystemPrompt(mode);
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain("PromptCraft AI");
  });

  it("returns distinct prompts per mode", async () => {
    const { buildSystemPrompt } = await loadGroq("secret");
    const prompts = MODES.map((mode) => buildSystemPrompt(mode));
    expect(new Set(prompts).size).toBe(MODES.length);
  });

  it("does not append a context line when neither domain nor tone is given", async () => {
    const { buildSystemPrompt } = await loadGroq("secret");
    expect(buildSystemPrompt("quick")).not.toContain("User selected");
  });

  it.each([
    ["legal", undefined, "Domain: legal, Tone: any"],
    [undefined, "witty", "Domain: any, Tone: witty"],
    ["legal", "witty", "Domain: legal, Tone: witty"],
  ])("appends the selected context for domain=%s tone=%s", async (domain, tone, expected) => {
    const { buildSystemPrompt } = await loadGroq("secret");
    expect(buildSystemPrompt("standard", domain, tone)).toContain(expected);
  });

  it("keeps the base prompt intact when context is appended", async () => {
    const { buildSystemPrompt } = await loadGroq("secret");
    const base = buildSystemPrompt("standard");
    expect(buildSystemPrompt("standard", "legal")).toContain(base);
  });
});

describe("streamGroq", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("throws when no API key is configured", async () => {
    const { streamGroq } = await loadGroq(undefined);
    await expect(streamGroq([], () => {}, () => {})).rejects.toThrow("No API key configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the messages with the prefixed key and streaming enabled", async () => {
    fetchMock.mockResolvedValue(sseResponse(["data: [DONE]\n"]));
    const { streamGroq } = await loadGroq("abc");

    const messages = [{ role: "user" as const, content: "hi" }];
    await streamGroq(messages, () => {}, () => {});

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer gsk_abc");
    expect(JSON.parse(init.body)).toMatchObject({ stream: true, messages });
  });

  it("emits each delta and finishes on the [DONE] sentinel", async () => {
    fetchMock.mockResolvedValue(sseResponse([delta("Hello"), delta(" world"), "data: [DONE]\n"]));
    const { streamGroq } = await loadGroq("abc");

    const onDelta = vi.fn();
    const onDone = vi.fn();
    await streamGroq([], onDelta, onDone);

    expect(onDelta.mock.calls.map(([d]) => d)).toEqual(["Hello", " world"]);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("handles deltas split across chunk boundaries", async () => {
    const line = delta("split");
    fetchMock.mockResolvedValue(sseResponse([line.slice(0, 12), line.slice(12), "data: [DONE]\n"]));
    const { streamGroq } = await loadGroq("abc");

    const onDelta = vi.fn();
    await streamGroq([], onDelta, () => {});
    expect(onDelta).toHaveBeenCalledExactlyOnceWith("split");
  });

  it("ignores non-data lines, empty deltas and malformed json", async () => {
    fetchMock.mockResolvedValue(
      sseResponse([
        ": keep-alive\n",
        "\n",
        "data: not-json\n",
        `data: ${JSON.stringify({ choices: [{ delta: {} }] })}\n`,
        delta("ok"),
        "data: [DONE]\n",
      ]),
    );
    const { streamGroq } = await loadGroq("abc");

    const onDelta = vi.fn();
    const onDone = vi.fn();
    await streamGroq([], onDelta, onDone);

    expect(onDelta).toHaveBeenCalledExactlyOnceWith("ok");
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("calls onDone when the stream ends without a [DONE] sentinel", async () => {
    fetchMock.mockResolvedValue(sseResponse([delta("partial")]));
    const { streamGroq } = await loadGroq("abc");

    const onDone = vi.fn();
    await streamGroq([], () => {}, onDone);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("throws a rate-limit error on HTTP 429", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));
    const { streamGroq } = await loadGroq("abc");

    await expect(streamGroq([], () => {}, () => {})).rejects.toThrow(/Daily limit reached/);
  });

  it("throws with the status code on other HTTP errors", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const { streamGroq } = await loadGroq("abc");

    await expect(streamGroq([], () => {}, () => {})).rejects.toThrow("Generation failed (500)");
  });
});
