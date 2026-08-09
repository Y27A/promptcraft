import type { Response } from "express";

/**
 * Reports a failure on an SSE response, falling back to a JSON error when the
 * stream has not started yet.
 */
export function failStream(res: Response, message: string, status = 502) {
  if (res.writableEnded) return;
  if (!res.headersSent) {
    res.status(status).json({ error: message });
    return;
  }
  res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}
