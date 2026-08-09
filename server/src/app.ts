import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler, HttpError } from "./middleware/errorHandler";

import promptsRouter from "./routes/prompts";
import templatesRouter, { userTemplatesRouter } from "./routes/templates";
import sessionsRouter from "./routes/sessions";
import openaiRouter from "./routes/openai";
import trialRouter from "./routes/trial";
import settingsRouter from "./routes/settings";
import socialRouter from "./routes/social";
import adminRouter from "./routes/admin";

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new HttpError(403, "Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET ?? "dev-secret"));
app.use(clerkMiddleware());

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/prompts", promptsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/user-templates", userTemplatesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/openai", openaiRouter);
app.use("/api/trial", trialRouter);
app.use("/api/me", settingsRouter);
app.use("/api", socialRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
