import type { Response } from "express";

export function startSSE(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

export function sendSSE(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function endSSE(res: Response) {
  res.write("data: [DONE]\n\n");
  res.end();
}
