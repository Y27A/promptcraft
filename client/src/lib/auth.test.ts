import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthToken, setTokenGetter } from "./auth";

describe("auth token getter", () => {
  beforeEach(() => {
    setTokenGetter(async () => null);
  });

  it("returns null when the registered getter resolves to null", async () => {
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("returns the token produced by the registered getter", async () => {
    setTokenGetter(async () => "token-123");
    await expect(getAuthToken()).resolves.toBe("token-123");
  });

  it("uses the most recently registered getter", async () => {
    const first = vi.fn(async () => "first");
    const second = vi.fn(async () => "second");
    setTokenGetter(first);
    setTokenGetter(second);

    await expect(getAuthToken()).resolves.toBe("second");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("propagates rejections from the getter", async () => {
    setTokenGetter(async () => {
      throw new Error("clerk unavailable");
    });
    await expect(getAuthToken()).rejects.toThrow("clerk unavailable");
  });
});
