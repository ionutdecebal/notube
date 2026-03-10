import {
  CandidateSource,
  DemoState,
  LearningScore,
  QuizAttempt,
  RankingMeta,
  Reflection,
  RetrievalFallbackReason,
  SessionFilters,
  SkipEvent,
  SuggestionFeedback,
  VideoCandidate,
} from "@/lib/types";
import { DEFAULT_FILTERS, DEFAULT_SCORE, MOCK_VIDEOS, buildDemoSession } from "@/lib/mock-data";

const STORAGE_KEY = "notube-demo-state";
const WATCH_COMPLETION_THRESHOLD = 0.85;
const WATCH_PROGRESS_UPDATE_STEP_SECONDS = 5;
const PERSIST_DEBOUNCE_MS = 1200;

let memoryState: DemoState | null = null;
let pendingPersistState: DemoState | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_RANKING: RankingMeta = {
  strategy: "deterministic",
  aiUsed: false,
  aiAttempted: false,
  shortlistSize: 0,
  candidates: [],
};

const persistSnapshot = async (state: DemoState) => {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/persist/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  } catch {
    // local state remains source of truth if network call fails
  }
};

const schedulePersistSnapshot = (state: DemoState) => {
  pendingPersistState = state;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const next = pendingPersistState;
    pendingPersistState = null;
    persistTimer = null;
    if (next) void persistSnapshot(next);
  }, PERSIST_DEBOUNCE_MS);
};

export const hydrateDemoStateFromServer = async (sessionId: string): Promise<DemoState | null> => {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(`/api/persist/session?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { state?: DemoState };
    if (!payload.state?.session?.id) return null;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.state));
    return payload.state;
  } catch {
    return null;
  }
};

const defaultState = (
  topic = "TypeScript for web development",
  filters = DEFAULT_FILTERS,
  candidates: VideoCandidate[] = MOCK_VIDEOS,
  retrieval: {
    source: CandidateSource;
    fallbackReason?: RetrievalFallbackReason;
    attempts: number;
  } = {
    source: "mock",
    attempts: 0,
  },
  ranking: RankingMeta = DEFAULT_RANKING,
): DemoState => ({
  session: buildDemoSession(topic, filters, candidates),
  videoCandidates: candidates,
  retrieval,
  ranking,
  watchProgress: {
    watchedSeconds: 0,
    durationSeconds: 0,
    watchCompletedAt: null,
  },
  reflection: null,
  quizAttempt: null,
  learningScore: null,
  skipEvents: [],
  suggestionFeedback: [],
});

const canUseStorage = () => typeof window !== "undefined";

export const getDemoState = (): DemoState => {
  if (!canUseStorage()) {
    if (!memoryState) {
      memoryState = defaultState();
    }
    return memoryState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = defaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    if (!parsed || !parsed.session || !parsed.videoCandidates) {
      const fallback = defaultState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    return {
      ...parsed,
      retrieval: parsed.retrieval ?? {
        source: "mock",
        attempts: 0,
      },
      ranking: {
        ...DEFAULT_RANKING,
        ...(parsed.ranking ?? {}),
      },
      watchProgress: parsed.watchProgress ?? {
        watchedSeconds: 0,
        durationSeconds: 0,
        watchCompletedAt: null,
      },
      suggestionFeedback: parsed.suggestionFeedback ?? [],
    } as DemoState;
  } catch {
    const fallback = defaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

const setDemoState = (next: DemoState) => {
  if (!canUseStorage()) {
    memoryState = next;
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  schedulePersistSnapshot(next);
};

export const initializeDemoState = (
  topic: string,
  filters: SessionFilters,
  candidates: VideoCandidate[] = MOCK_VIDEOS,
  retrieval: {
    source: CandidateSource;
    fallbackReason?: RetrievalFallbackReason;
    attempts: number;
  } = {
    source: "mock",
    attempts: 0,
  },
  ranking: RankingMeta = DEFAULT_RANKING,
) => {
  const next = defaultState(topic, filters, candidates, retrieval, ranking);
  setDemoState(next);
  return next;
};

export const saveReflection = (reflection: Reflection) => {
  const current = getDemoState();
  setDemoState({ ...current, reflection });
};

export const saveQuizAttempt = (quizAttempt: QuizAttempt, learningScore: LearningScore) => {
  const current = getDemoState();
  setDemoState({ ...current, quizAttempt, learningScore });
};

export const addSkipEvent = (skipEvent: Omit<SkipEvent, "id" | "skippedAt">) => {
  const current = getDemoState();
  const nextSkip: SkipEvent = {
    ...skipEvent,
    id: crypto.randomUUID(),
    skippedAt: new Date().toISOString(),
  };
  setDemoState({ ...current, skipEvents: [...current.skipEvents, nextSkip] });
};

export const addSuggestionFeedback = (
  feedback: Omit<SuggestionFeedback, "id" | "submittedAt">,
) => {
  const current = getDemoState();
  const next: SuggestionFeedback = {
    ...feedback,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  };
  setDemoState({
    ...current,
    suggestionFeedback: [...current.suggestionFeedback, next],
  });
};

export const getLearningScoreOrDefault = (): LearningScore => {
  const current = getDemoState();
  return current.learningScore ?? { ...DEFAULT_SCORE, sessionId: current.session.id };
};

export const saveWatchProgress = (watchedSeconds: number, durationSeconds: number) => {
  const current = getDemoState();
  const boundedDuration = Math.max(0, durationSeconds);
  const boundedWatched = Math.max(0, Math.min(watchedSeconds, boundedDuration || watchedSeconds));
  const previousCompleted = Boolean(current.watchProgress.watchCompletedAt);
  const completed = boundedDuration > 0 && boundedWatched / boundedDuration >= WATCH_COMPLETION_THRESHOLD;

  const watchedDelta = Math.abs(boundedWatched - current.watchProgress.watchedSeconds);
  const durationDelta = Math.abs(boundedDuration - current.watchProgress.durationSeconds);
  if (
    watchedDelta < WATCH_PROGRESS_UPDATE_STEP_SECONDS &&
    durationDelta < WATCH_PROGRESS_UPDATE_STEP_SECONDS &&
    previousCompleted === completed
  ) {
    return;
  }

  setDemoState({
    ...current,
    watchProgress: {
      watchedSeconds: boundedWatched,
      durationSeconds: boundedDuration,
      watchCompletedAt: completed ? current.watchProgress.watchCompletedAt ?? new Date().toISOString() : null,
    },
  });
};

export const isWatchCompleted = (): boolean => {
  const current = getDemoState();
  const { watchedSeconds, durationSeconds, watchCompletedAt } = current.watchProgress;
  if (watchCompletedAt) return true;
  if (durationSeconds <= 0) return false;
  return watchedSeconds / durationSeconds >= WATCH_COMPLETION_THRESHOLD;
};
