import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setTokenGetter } from "./auth";
import { API_BASE, apiFetch, cn, formatAge } from "./utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("lets later tailwind classes win over conflicting earlier ones", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500");
  });

  it("supports arrays and objects", () => {
    expect(cn(["flex", { italic: false, underline: true }])).toBe("flex underline");
  });
});

describe("formatAge", () => {
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it.each([
    [0, "just now"],
    [59 * SECOND, "just now"],
    [MINUTE, "1m ago"],
    [59 * MINUTE + 59 * SECOND, "59m ago"],
    [HOUR, "1h ago"],
    [23 * HOUR, "23h ago"],
    [DAY, "1d ago"],
    [10 * DAY, "10d ago"],
  ])("formats %ims as %s", (ms, expected) => {
    expect(formatAge(ms)).toBe(expected);
  });
});

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    setTokenGetter(async () => null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const headersOf = () => fetchMock.mock.calls[0][1].headers as Record<string, string>;

  it("prefixes the path with API_BASE and always sends credentials", async () => {
    await apiFetch("/api/prompts");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/prompts`);
    expect(fetchMock.mock.calls[0][1].credentials).toBe("include");
  });

  it("omits the Authorization header when there is no token", async () => {
    await apiFetch("/api/prompts");
    expect(headersOf()).not.toHaveProperty("Authorization");
    expect(headersOf()["Content-Type"]).toBe("application/json");
  });

  it("adds a bearer Authorization header when a token is available", async () => {
    setTokenGetter(async () => "jwt-abc");
    await apiFetch("/api/prompts");
    expect(headersOf().Authorization).toBe("Bearer jwt-abc");
  });

  it("lets caller headers override the defaults and preserves other options", async () => {
    setTokenGetter(async () => "jwt-abc");
    await apiFetch("/api/upload", {
      method: "POST",
      body: "raw",
      headers: { "Content-Type": "text/plain", Authorization: "Bearer override" },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe("raw");
    expect(init.headers["Content-Type"]).toBe("text/plain");
    expect(init.headers.Authorization).toBe("Bearer override");
  });

  it("returns the response from fetch untouched", async () => {
    const response = new Response("ok", { status: 201 });
    fetchMock.mockResolvedValue(response);
    await expect(apiFetch("/api/x")).resolves.toBe(response);
  });
});
