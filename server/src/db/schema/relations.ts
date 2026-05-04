import { relations } from "drizzle-orm";
import { sessions } from "./sessions";
import { sessionMessages } from "./sessionMessages";
import { sessionFavorites } from "./sessionFavorites";
import { sessionTags } from "./sessionTags";
import { messageRatings } from "./messageRatings";

export const sessionsRelations = relations(sessions, ({ many }) => ({
  sessionMessages: many(sessionMessages),
  sessionFavorites: many(sessionFavorites),
  sessionTags: many(sessionTags),
}));

export const sessionMessagesRelations = relations(sessionMessages, ({ one, many }) => ({
  session: one(sessions, { fields: [sessionMessages.sessionId], references: [sessions.id] }),
  messageRatings: many(messageRatings),
}));

export const messageRatingsRelations = relations(messageRatings, ({ one }) => ({
  message: one(sessionMessages, { fields: [messageRatings.messageId], references: [sessionMessages.id] }),
}));

export const sessionFavoritesRelations = relations(sessionFavorites, ({ one }) => ({
  session: one(sessions, { fields: [sessionFavorites.sessionId], references: [sessions.id] }),
}));

export const sessionTagsRelations = relations(sessionTags, ({ one }) => ({
  session: one(sessions, { fields: [sessionTags.sessionId], references: [sessions.id] }),
}));
