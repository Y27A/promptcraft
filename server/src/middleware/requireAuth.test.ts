import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuth = vi.fn();
vi.mock("@clerk/express", () => ({ getAuth: (req: Request) => getAuth(req) }));

const { requireAuth } = await import("./requireAuth");

function makeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("requireAuth", () => {
  let req: Request;
  let res: ReturnType<typeof makeRes>;
  let next: NextFunction;

  beforeEach(() => {
    getAuth.mockReset();
    req = {} as Request;
    res = makeRes();
    next = vi.fn();
  });

  it("attaches the userId and calls next for an authenticated request", () => {
    getAuth.mockReturnValue({ userId: "user_1" });

    requireAuth(req, res, next);

    expect((req as Request & { userId: string }).userId).toBe("user_1");
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
  });

  it("responds 401 without calling next when there is no userId", () => {
    getAuth.mockReturnValue({ userId: null });

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
    expect(req).not.toHaveProperty("userId");
  });

  it("responds 401 when clerk returns an undefined userId", () => {
    getAuth.mockReturnValue({});

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes the incoming request through to clerk", () => {
    getAuth.mockReturnValue({ userId: "user_1" });

    requireAuth(req, res, next);

    expect(getAuth).toHaveBeenCalledWith(req);
  });
});
