import { pgTable, serial, text, json, timestamp } from "drizzle-orm/pg-core";

export const userTemplates = pgTable("user_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  exampleOutput: text("example_output"),
  difficulty: text("difficulty").notNull().default("beginner"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserTemplate = typeof userTemplates.$inferSelect;
export type NewUserTemplate = typeof userTemplates.$inferInsert;
