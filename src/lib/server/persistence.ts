import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessionStates } from "@/db/schema";
import { DemoState } from "@/lib/types";

let writeQueue: Promise<void> = Promise.resolve();
const FEEDBACK_CACHE_TTL_MS = 30_000;

interface FeedbackSignals {
  channelWeights: Record<string, number>;
  tokenWeights: Record<string, number>;
  sampleCount: number;
}

let feedbackCache:
  | {
      data: FeedbackSignals;
      expiresAt: number;
    }
  | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);

const getNormalizedSessionState = (state: DemoState) => {
  const selectedVideo =
    state.videoCandidates.find((video) => video.id === state.session.selectedVideoId) ??
    state.videoCandidates[0] ??
    null;
  const watchRatio = state.watchProgress.durationSeconds
    ? state.watchProgress.watchedSeconds / state.watchProgress.durationSeconds
    : 0;

  return {
    topic: state.session.topic,
    selectedVideoId: state.session.selectedVideoId,
    selectedVideoTitle: selectedVideo?.title ?? "",
    selectedVideoChannel: selectedVideo?.channel ?? "",
    createdAt: new Date(state.session.createdAt),
    watchPercent: Math.max(0, Math.min(100, Math.round(watchRatio * 100))),
    quizScore: state.learningScore?.total ?? null,
    quizCompleted: Boolean(state.quizAttempt && state.learningScore),
    reflectionCompleted: Boolean(state.reflection),
    backupsOpened: state.skipEvents.filter((event) => event.stage === "watch").length,
    feedbackCount: state.suggestionFeedback.length,
  };
};

export const upsertSessionState = async (state: DemoState, userId?: string | null) => {
  writeQueue = writeQueue.then(async () => {
    const db = getDb();
    const updatedAt = new Date();
    const normalizedState = getNormalizedSessionState(state);

    await db
      .insert(sessionStates)
      .values({
        id: state.session.id,
        userId: userId ?? null,
        ...normalizedState,
        state,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: sessionStates.id,
        set: {
          userId: userId ?? null,
          ...normalizedState,
          state,
          updatedAt,
        },
      });

    feedbackCache = null;
  });

  await writeQueue;
};

export const getSessionState = async (sessionId: string): Promise<DemoState | null> => {
  const db = getDb();
  const [row] = await db.select().from(sessionStates).where(eq(sessionStates.id, sessionId)).limit(1);
  return row?.state ?? null;
};

export const getFeedbackSignals = async (): Promise<FeedbackSignals> => {
  if (feedbackCache && feedbackCache.expiresAt > Date.now()) {
    return feedbackCache.data;
  }

  const db = getDb();
  const rows = await db
    .select({
      state: sessionStates.state,
    })
    .from(sessionStates)
    .orderBy(desc(sessionStates.updatedAt));

  const channelWeights: Record<string, number> = {};
  const tokenWeights: Record<string, number> = {};
  let sampleCount = 0;

  for (const sessionEntry of rows) {
    const state = sessionEntry.state;
    const feedbackList = state.suggestionFeedback ?? [];
    if (!feedbackList.length) continue;

    for (const feedback of feedbackList) {
      const weight =
        feedback.rating === "good"
          ? 1.2
          : feedback.rating === "bad"
            ? -1.2
            : 0;
      if (weight === 0) continue;

      sampleCount += 1;

      const candidate = state.videoCandidates.find((video) => video.id === feedback.videoId);
      if (candidate) {
        const channelKey = candidate.channel.trim().toLowerCase();
        channelWeights[channelKey] = clamp((channelWeights[channelKey] ?? 0) + weight, -6, 6);

        const titleTokens = Array.from(new Set(tokenize(candidate.title))).slice(0, 8);
        for (const token of titleTokens) {
          tokenWeights[token] = clamp((tokenWeights[token] ?? 0) + weight * 0.35, -3, 3);
        }
      }

      const commentTokens = Array.from(new Set(tokenize(feedback.comment))).slice(0, 6);
      for (const token of commentTokens) {
        tokenWeights[token] = clamp((tokenWeights[token] ?? 0) + weight * 0.2, -2, 2);
      }
    }
  }

  const data = { channelWeights, tokenWeights, sampleCount };
  feedbackCache = {
    data,
    expiresAt: Date.now() + FEEDBACK_CACHE_TTL_MS,
  };
  return data;
};
