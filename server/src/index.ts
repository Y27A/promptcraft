import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL is not set — refusing to start");
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  logger.warn("GROQ_API_KEY is not set — generation endpoints will fail");
}

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  logger.error({ err }, "Server failed to start");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  server.close(() => process.exit(1));
});
