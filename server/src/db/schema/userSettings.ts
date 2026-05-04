import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  themePref: text("theme_pref").notNull().default("system"),
  defaultTone: text("default_tone").notNull().default("professional"),
  defaultModel: text("default_model").notNull().default("gpt-4o-mini"),
  tier: text("tier").notNull().default("free"),
  monthlyGenCount: integer("monthly_gen_count").notNull().default(0),
  monthlyGenPeriod: text("monthly_gen_period").notNull().default("1970-01"),
  dailyGenCount: integer("daily_gen_count").notNull().default(0),
  dailyGenPeriod: text("daily_gen_period").notNull().default("1970-01-01"),
  stripeCustomerId: text("stripe_customer_id"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;
