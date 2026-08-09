import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly details?: unknown) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.flatten() });
    return;
  }

  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : "Internal server error";

  logger.error(
    { err, method: req.method, path: req.originalUrl, status },
    "request failed"
  );

  if (res.headersSent) {
    res.end();
    return;
  }

  res.status(status).json({
    error: message,
    ...(err instanceof HttpError && err.details !== undefined ? { details: err.details } : {}),
  });
}
