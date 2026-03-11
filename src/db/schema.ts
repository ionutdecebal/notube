import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { DemoState } from "@/lib/types";

export const sessionStates = pgTable("session_states", {
  id: text("id").primaryKey(),
  state: jsonb("state").$type<DemoState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
