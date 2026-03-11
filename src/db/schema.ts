import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { DemoState, QuizMode } from "@/lib/types";

export const sessionStates = pgTable("session_states", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  topic: text("topic").notNull().default(""),
  selectedVideoId: text("selected_video_id").notNull().default(""),
  selectedVideoTitle: text("selected_video_title").notNull().default(""),
  selectedVideoChannel: text("selected_video_channel").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  watchPercent: integer("watch_percent").notNull().default(0),
  quizScore: integer("quiz_score"),
  quizCompleted: boolean("quiz_completed").notNull().default(false),
  reflectionCompleted: boolean("reflection_completed").notNull().default(false),
  backupsOpened: integer("backups_opened").notNull().default(0),
  feedbackCount: integer("feedback_count").notNull().default(0),
  state: jsonb("state").$type<DemoState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  quizMode: text("quiz_mode").$type<QuizMode>().notNull().default("standard"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
