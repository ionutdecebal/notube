import "server-only";

import { desc, eq, getTableColumns } from "drizzle-orm";
import { getDb } from "@/db";
import { sessionStates } from "@/db/schema";
import { DemoState } from "@/lib/types";

interface SessionStateRow {
  id: string;
  userId: string | null;
  state: DemoState;
  updatedAt: Date;
}

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

const toSummary = (row: SessionStateRow): UserSessionSummary => {
  const selectedVideo =
    row.state.videoCandidates.find((video) => video.id === row.state.session.selectedVideoId) ??
    row.state.videoCandidates[0];
  const watchedSeconds = row.state.watchProgress.durationSeconds
    ? row.state.watchProgress.watchedSeconds / row.state.watchProgress.durationSeconds
    : 0;
  const watchPercent = Math.max(0, Math.min(100, Math.round(watchedSeconds * 100)));
  const backupOpenCount = row.state.skipEvents.filter((event) => event.stage === "watch").length;

  return {
    id: row.id,
    topic: row.state.session.topic,
    selectedVideoTitle: selectedVideo?.title ?? "Lesson unavailable",
    selectedVideoChannel: selectedVideo?.channel ?? "Unknown channel",
    createdAt: row.state.session.createdAt,
    updatedAt: row.updatedAt.toISOString(),
    quizScore: row.state.learningScore?.total ?? null,
    quizCompleted: Boolean(row.state.quizAttempt && row.state.learningScore),
    watchPercent,
    reflectionCompleted: Boolean(row.state.reflection),
    backupsOpened: backupOpenCount,
    feedbackCount: row.state.suggestionFeedback.length,
  };
};

export const getUserSessionSummaries = async (userId: string): Promise<UserSessionSummary[]> => {
  const db = getDb();
  const rows = await db
    .select(getTableColumns(sessionStates))
    .from(sessionStates)
    .where(eq(sessionStates.userId, userId))
    .orderBy(desc(sessionStates.updatedAt));

  return rows.map((row) => toSummary(row as SessionStateRow));
};

export const getUserStatsSummary = async (userId: string): Promise<UserStatsSummary> => {
  const sessions = await getUserSessionSummaries(userId);

  const completedCount = sessions.filter((session) => session.quizCompleted).length;
  const scoredSessions = sessions.filter((session) => session.quizScore !== null);
  const averageQuizScore = scoredSessions.length
    ? Math.round(
        scoredSessions.reduce((total, session) => total + (session.quizScore ?? 0), 0) / scoredSessions.length,
      )
    : null;
  const averageWatchPercent = sessions.length
    ? Math.round(sessions.reduce((total, session) => total + session.watchPercent, 0) / sessions.length)
    : 0;
  const backupOpenCount = sessions.reduce((total, session) => total + session.backupsOpened, 0);
  const feedbackCount = sessions.reduce((total, session) => total + session.feedbackCount, 0);

  return {
    sessionCount: sessions.length,
    completedCount,
    averageQuizScore,
    averageWatchPercent,
    backupOpenCount,
    feedbackCount,
  };
};
