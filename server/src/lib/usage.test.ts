import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const insertReturning = vi.fn();
const updateReturning = vi.fn();
const updateSet = vi.fn();
const updateWhere = vi.fn();

/**
 * Minimal chainable stand-in for the drizzle query builder: every builder step
 * records its argument and the terminal step is both awaitable and `.returning()`-able.
 */
function makeDb() {
  const updateResult = {
    returning: () => updateReturning(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(undefined).then(resolve),
  };
  return {
    query: { userSettings: { findFirst: (args: unknown) => findFirst(args) } },
    insert: () => ({
      values: (values: unknown) => ({ returning: () => insertReturning(values) }),
    }),
    update: () => ({
      set: (values: unknown) => {
        updateSet(values);
        return {
          where: (condition: unknown) => {
            updateWhere(condition);
            return updateResult;
          },
        };
      },
    }),
  };
}

vi.mock("../db/client", () => ({ db: makeDb() }));

const {
  ANON_TRIAL_LIMIT,
  FREE_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
  UNLIMITED_DAILY_LIMIT,
  decrementUserGenCount,
  getDailyLimit,
  getDailyUsageRow,
  getOrCreateSettings,
  readTrialCount,
  reserveUserGenSlot,
  writeTrialCount,
} = await import("./usage");

const today = () => new Date().toISOString().slice(0, 10);

const settingsRow = (overrides: Record<string, unknown> = {}) => ({
  userId: "user_1",
  tier: "free",
  dailyGenCount: 0,
  dailyGenPeriod: today(),
  ...overrides,
});

beforeEach(() => {
  for (const mock of [findFirst, insertReturning, updateReturning, updateSet, updateWhere]) mock.mockReset();
  updateReturning.mockResolvedValue([settingsRow()]);
});

describe("limit constants", () => {
  it("matches the documented tier limits", () => {
    expect(ANON_TRIAL_LIMIT).toBe(10);
    expect(FREE_DAILY_LIMIT).toBe(25);
    expect(PRO_DAILY_LIMIT).toBe(50);
    expect(UNLIMITED_DAILY_LIMIT).toBe(-1);
  });
});

describe("getDailyLimit", () => {
  it.each([
    ["free", FREE_DAILY_LIMIT],
    ["pro", PRO_DAILY_LIMIT],
    ["unlimited", UNLIMITED_DAILY_LIMIT],
    ["something-unknown", FREE_DAILY_LIMIT],
    ["", FREE_DAILY_LIMIT],
  ])("maps tier %s to %i", async (tier, expected) => {
    await expect(getDailyLimit(tier)).resolves.toBe(expected);
  });
});

describe("getOrCreateSettings", () => {
  it("returns the existing row without inserting", async () => {
    const existing = settingsRow();
    findFirst.mockResolvedValue(existing);

    await expect(getOrCreateSettings("user_1")).resolves.toBe(existing);
    expect(insertReturning).not.toHaveBeenCalled();
  });

  it("inserts and returns a new row when none exists", async () => {
    findFirst.mockResolvedValue(undefined);
    const created = settingsRow({ userId: "user_2" });
    insertReturning.mockResolvedValue([created]);

    await expect(getOrCreateSettings("user_2")).resolves.toBe(created);
    expect(insertReturning).toHaveBeenCalledWith({ userId: "user_2" });
  });
});

describe("getDailyUsageRow", () => {
  it("returns the row unchanged when the period is today", async () => {
    const existing = settingsRow({ dailyGenCount: 7 });
    findFirst.mockResolvedValue(existing);

    await expect(getDailyUsageRow("user_1")).resolves.toBe(existing);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("resets the counter when the stored period is stale", async () => {
    findFirst.mockResolvedValue(settingsRow({ dailyGenCount: 7, dailyGenPeriod: "1970-01-01" }));
    const reset = settingsRow({ dailyGenCount: 0 });
    updateReturning.mockResolvedValue([reset]);

    await expect(getDailyUsageRow("user_1")).resolves.toBe(reset);
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ dailyGenCount: 0, dailyGenPeriod: today() }),
    );
  });
});

describe("reserveUserGenSlot", () => {
  it("always grants a slot to unlimited users", async () => {
    findFirst.mockResolvedValue(settingsRow({ tier: "unlimited", dailyGenCount: 9999 }));

    await expect(reserveUserGenSlot("user_1")).resolves.toBe(true);
    expect(updateReturning).not.toHaveBeenCalled();
    expect(updateSet).toHaveBeenCalledOnce();
  });

  it("grants a slot when the conditional update incremented the counter", async () => {
    findFirst.mockResolvedValue(settingsRow({ dailyGenCount: 3 }));
    updateReturning.mockResolvedValue([settingsRow({ dailyGenCount: 4 })]);

    await expect(reserveUserGenSlot("user_1")).resolves.toBe(true);
  });

  it("denies a slot when the counter did not move because the limit was reached", async () => {
    findFirst.mockResolvedValue(settingsRow({ dailyGenCount: FREE_DAILY_LIMIT }));
    updateReturning.mockResolvedValue([settingsRow({ dailyGenCount: FREE_DAILY_LIMIT })]);

    await expect(reserveUserGenSlot("user_1")).resolves.toBe(false);
  });

  it("compares against the count from the reset row for a stale period", async () => {
    findFirst.mockResolvedValue(settingsRow({ dailyGenCount: FREE_DAILY_LIMIT, dailyGenPeriod: "1970-01-01" }));
    updateReturning
      .mockResolvedValueOnce([settingsRow({ dailyGenCount: 0 })])
      .mockResolvedValueOnce([settingsRow({ dailyGenCount: 1 })]);

    await expect(reserveUserGenSlot("user_1")).resolves.toBe(true);
  });
});

describe("decrementUserGenCount", () => {
  it("issues a floored decrement for the user", async () => {
    await decrementUserGenCount("user_1");

    expect(updateSet).toHaveBeenCalledOnce();
    expect(updateWhere).toHaveBeenCalledOnce();
    expect(updateSet.mock.calls[0][0]).toHaveProperty("dailyGenCount");
  });
});

describe("readTrialCount", () => {
  const req = (cookies?: Record<string, string>) => ({ signedCookies: cookies }) as unknown as Request;

  it.each([
    [undefined, 0],
    [{}, 0],
    [{ pc_trial: "3" }, 3],
    [{ pc_trial: "0" }, 0],
    [{ pc_trial: "not-a-number" }, 0],
    [{ pc_trial: "7abc" }, 7],
  ])("reads %j as %i", (cookies, expected) => {
    expect(readTrialCount(req(cookies as Record<string, string> | undefined))).toBe(expected);
  });

  it("returns 0 when the request has no signed cookies at all", () => {
    expect(readTrialCount({} as Request)).toBe(0);
  });
});

describe("writeTrialCount", () => {
  const cookie = vi.fn();
  const res = { cookie } as unknown as Response;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => cookie.mockReset());
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("writes a signed, httpOnly cookie with the stringified count", () => {
    writeTrialCount(res, 4);

    const [name, value, options] = cookie.mock.calls[0];
    expect(name).toBe("pc_trial");
    expect(value).toBe("4");
    expect(options).toMatchObject({ signed: true, httpOnly: true, sameSite: "lax" });
    expect(options.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("only marks the cookie secure in production", () => {
    process.env.NODE_ENV = "development";
    writeTrialCount(res, 1);
    expect(cookie.mock.calls[0][2].secure).toBe(false);

    process.env.NODE_ENV = "production";
    writeTrialCount(res, 1);
    expect(cookie.mock.calls[1][2].secure).toBe(true);
  });
});
