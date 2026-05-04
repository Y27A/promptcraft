import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { sessionMessages } from "./sessionMessages";

export const messageRatings = pgTable(
  "message_ratings",
  {
    messageId: integer("message_id")
      .notNull()
      .references(() => sessionMessages.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    rating: text("rating").notNull(), // "up" | "down"
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId] })]
);
