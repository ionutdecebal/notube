import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { DemoState, QuizMode } from "@/lib/types";

export const sessionStates = pgTable("session_states", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  state: jsonb("state").$type<DemoState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  quizMode: text("quiz_mode").$type<QuizMode>().notNull().default("standard"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
