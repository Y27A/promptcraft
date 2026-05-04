import { pgTable, serial, text, json, timestamp } from "drizzle-orm/pg-core";

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  exampleOutput: text("example_output"),
  difficulty: text("difficulty").notNull().default("beginner"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
