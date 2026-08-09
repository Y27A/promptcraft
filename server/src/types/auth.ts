import type { Request } from "express";

/** A request that has passed through `requireAuth`. */
export type AuthReq = Request & { userId: string };

/** Reads the id `requireAuth` attached to the request. */
export function getUserId(req: Request): string {
  return (req as unknown as AuthReq).userId;
}
