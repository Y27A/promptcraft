import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";

export const sessionTags = pgTable("session_tags", {
  id: text("id").primaryKey(), // composite key handled via unique index
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
