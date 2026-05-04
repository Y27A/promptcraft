import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";

export const sessionFavorites = pgTable(
  "session_favorites",
  {
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.userId] })]
);
