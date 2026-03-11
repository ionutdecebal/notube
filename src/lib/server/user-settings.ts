import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userSettings } from "@/db/schema";
import { QuizMode } from "@/lib/types";

export interface StoredUserSettings {
  quizMode: QuizMode;
}

export const DEFAULT_USER_SETTINGS: StoredUserSettings = {
  quizMode: "standard",
};

export const getUserSettings = async (userId: string): Promise<StoredUserSettings> => {
  const db = getDb();
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

  if (!row) {
    return DEFAULT_USER_SETTINGS;
  }

  return {
    quizMode: row.quizMode,
  };
};

export const upsertUserSettings = async (userId: string, settings: StoredUserSettings) => {
  const db = getDb();
  const updatedAt = new Date();

  await db
    .insert(userSettings)
    .values({
      userId,
      quizMode: settings.quizMode,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        quizMode: settings.quizMode,
        updatedAt,
      },
    });
};
