import "server-only";

import { avg, count, desc, eq, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { sessionStates } from "@/db/schema";

export interface UserSessionSummary {
  id: string;
  topic: string;
  selectedVideoTitle: string;
  selectedVideoChannel: string;
  createdAt: string;
  updatedAt: string;
  quizScore: number | null;
  quizCompleted: boolean;
  watchPercent: number;
  reflectionCompleted: boolean;
  backupsOpened: number;
  feedbackCount: number;
}

export interface UserStatsSummary {
  sessionCount: number;
  completedCount: number;
  averageQuizScore: number | null;
  averageWatchPercent: number;
  backupOpenCount: number;
  feedbackCount: number;
}

const toSummary = (row: {
  id: string;
  topic: string;
  selectedVideoTitle: string;
  selectedVideoChannel: string;
  createdAt: Date;
  updatedAt: Date;
  quizScore: number | null;
  quizCompleted: boolean;
  watchPercent: number;
  reflectionCompleted: boolean;
  backupsOpened: number;
  feedbackCount: number;
}): UserSessionSummary => {
  return {
    id: row.id,
    topic: row.topic,
    selectedVideoTitle: row.selectedVideoTitle || "Lesson unavailable",
    selectedVideoChannel: row.selectedVideoChannel || "Unknown channel",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    quizScore: row.quizScore,
    quizCompleted: row.quizCompleted,
    watchPercent: row.watchPercent,
    reflectionCompleted: row.reflectionCompleted,
    backupsOpened: row.backupsOpened,
    feedbackCount: row.feedbackCount,
  };
};

export const getUserSessionSummaries = async (userId: string): Promise<UserSessionSummary[]> => {
  const db = getDb();
  const rows = await db
    .select({
      id: sessionStates.id,
      topic: sessionStates.topic,
      selectedVideoTitle: sessionStates.selectedVideoTitle,
      selectedVideoChannel: sessionStates.selectedVideoChannel,
      createdAt: sessionStates.createdAt,
      updatedAt: sessionStates.updatedAt,
      quizScore: sessionStates.quizScore,
      quizCompleted: sessionStates.quizCompleted,
      watchPercent: sessionStates.watchPercent,
      reflectionCompleted: sessionStates.reflectionCompleted,
      backupsOpened: sessionStates.backupsOpened,
      feedbackCount: sessionStates.feedbackCount,
    })
    .from(sessionStates)
    .where(eq(sessionStates.userId, userId))
    .orderBy(desc(sessionStates.updatedAt));

  return rows.map((row) => toSummary(row));
};

export const getUserStatsSummary = async (userId: string): Promise<UserStatsSummary> => {
  const db = getDb();
  const [totals] = await db
    .select({
      sessionCount: count(),
      averageQuizScore: avg(sessionStates.quizScore).mapWith((value) =>
        value === null ? null : Math.round(Number(value)),
      ),
      averageWatchPercent: avg(sessionStates.watchPercent).mapWith((value) =>
        value === null ? 0 : Math.round(Number(value)),
      ),
      backupOpenCount: sum(sessionStates.backupsOpened).mapWith((value) => Number(value ?? 0)),
      feedbackCount: sum(sessionStates.feedbackCount).mapWith((value) => Number(value ?? 0)),
    })
    .from(sessionStates)
    .where(eq(sessionStates.userId, userId));

  const sessions = await db
    .select({
      quizCompleted: sessionStates.quizCompleted,
    })
    .from(sessionStates)
    .where(eq(sessionStates.userId, userId));

  const completedCount = sessions.filter((session) => session.quizCompleted).length;

  return {
    sessionCount: totals?.sessionCount ?? sessions.length,
    completedCount,
    averageQuizScore: totals?.averageQuizScore ?? null,
    averageWatchPercent: totals?.averageWatchPercent ?? 0,
    backupOpenCount: totals?.backupOpenCount ?? 0,
    feedbackCount: totals?.feedbackCount ?? 0,
  };
};
