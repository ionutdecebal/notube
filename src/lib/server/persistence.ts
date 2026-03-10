import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { DemoState } from "@/lib/types";

const DATA_DIR =
  process.env.NOTUBE_DATA_DIR ??
  (process.env.VERCEL ? path.join("/tmp", "notube-data") : path.join(process.cwd(), ".data"));
const DB_PATH = path.join(DATA_DIR, "notube-db.json");

interface PersistedDB {
  sessions: Record<
    string,
    {
      state: DemoState;
      updatedAt: string;
    }
  >;
}

const EMPTY_DB: PersistedDB = { sessions: {} };
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

const ensureDb = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
};

const readDb = async (): Promise<PersistedDB> => {
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PersistedDB;
    if (!parsed.sessions || typeof parsed.sessions !== "object") return EMPTY_DB;
    return parsed;
  } catch {
    return EMPTY_DB;
  }
};

const writeDb = async (db: PersistedDB) => {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
};

export const upsertSessionState = async (state: DemoState) => {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    db.sessions[state.session.id] = {
      state,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    feedbackCache = null;
  });
  await writeQueue;
};

export const getSessionState = async (sessionId: string): Promise<DemoState | null> => {
  const db = await readDb();
  return db.sessions[sessionId]?.state ?? null;
};

export const getFeedbackSignals = async (): Promise<FeedbackSignals> => {
  if (feedbackCache && feedbackCache.expiresAt > Date.now()) {
    return feedbackCache.data;
  }

  const db = await readDb();
  const channelWeights: Record<string, number> = {};
  const tokenWeights: Record<string, number> = {};
  let sampleCount = 0;

  for (const sessionEntry of Object.values(db.sessions)) {
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
