import { afterEach, describe, expect, it, vi } from "vitest";

const clerkUser = { user: { id: "user_1" }, isSignedIn: true, isLoaded: true };
const clerkAuth = { isSignedIn: true, isLoaded: true, getToken: async () => "jwt" };

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => clerkUser,
  useAuth: () => clerkAuth,
}));

async function loadClerkSafe(publishableKey: string) {
  vi.resetModules();
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", publishableKey);
  return import("./clerk-safe");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("HAS_CLERK", () => {
  it.each([
    ["pk_test_abc", true],
    ["pk_live_abc", true],
    ["sk_test_abc", false],
    ["", false],
  ])("is %s -> %s", async (key, expected) => {
    const { HAS_CLERK } = await loadClerkSafe(key);
    expect(HAS_CLERK).toBe(expected);
  });
});

describe("safe hook wrappers with a configured key", () => {
  it("delegates to the real Clerk hooks", async () => {
    const { useSafeUser, useSafeAuth } = await loadClerkSafe("pk_test_abc");
    expect(useSafeUser()).toBe(clerkUser);
    expect(useSafeAuth()).toBe(clerkAuth);
  });
});

describe("safe hook wrappers without a configured key", () => {
  it("returns a signed-out user stub", async () => {
    const { useSafeUser } = await loadClerkSafe("");
    expect(useSafeUser()).toEqual({ user: null, isSignedIn: false, isLoaded: true });
  });

  it("returns an auth stub whose getToken resolves to null", async () => {
    const { useSafeAuth } = await loadClerkSafe("");
    const auth = useSafeAuth();
    expect(auth.isSignedIn).toBe(false);
    expect(auth.isLoaded).toBe(true);
    await expect(auth.getToken()).resolves.toBeNull();
  });
});
