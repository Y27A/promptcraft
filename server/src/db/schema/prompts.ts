import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  description: text("description"),
  tags: text("tags").array().notNull().default([]),
  isFavorite: boolean("is_favorite").notNull().default(false),
  shareToken: text("share_token").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
