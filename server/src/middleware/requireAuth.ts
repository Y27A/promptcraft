import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import type { AuthReq } from "../types/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthReq).userId = userId;
  next();
}
