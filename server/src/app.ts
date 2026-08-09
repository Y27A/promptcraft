import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { logger } from "./lib/logger";

import promptsRouter from "./routes/prompts";
import templatesRouter, { userTemplatesRouter } from "./routes/templates";
import sessionsRouter from "./routes/sessions";
import openaiRouter from "./routes/openai";
import trialRouter from "./routes/trial";
import settingsRouter from "./routes/settings";
import socialRouter from "./routes/social";
import adminRouter from "./routes/admin";

const app = express();

// Render/Cloudflare terminate TLS in front of us; trust one proxy hop so
// rate limiting and secure cookies see the real client IP and protocol.
app.set("trust proxy", 1);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be set in production");
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "128kb" }));
app.use(express.urlencoded({ extended: true, limit: "128kb" }));
app.use(cookieParser(sessionSecret ?? "dev-secret"));
app.use(clerkMiddleware());

app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Unauthenticated generation is the most abusable surface — cap it harder.
const trialLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/prompts", promptsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/user-templates", userTemplatesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/openai", openaiRouter);
app.use("/api/trial", trialLimiter, trialRouter);
app.use("/api/me", settingsRouter);
app.use("/api", socialRouter);
app.use("/api/admin", adminRouter);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, "Unhandled request error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
