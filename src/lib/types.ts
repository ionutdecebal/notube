export type LessonRole = "primary" | "backup-simpler" | "backup-deeper";

export interface SessionFilters {
  difficulty: "beginner" | "intermediate" | "advanced";
  lessonMode: "quick-answer" | "full-tutorial";
  maxLengthMinutes: number;
}

export interface VideoCandidate {
  id: string;
  title: string;
  channel: string;
  durationMinutes: number;
  role: LessonRole;
  reasonSelected: string;
  videoUrl: string;
}

export type CandidateSource = "youtube" | "mock";

export type RetrievalFallbackReason =
  | "lie-mode-enabled"
  | "missing-api-key"
  | "search-timeout"
  | "search-rate-limited"
  | "search-http-error"
  | "search-empty-results"
  | "details-timeout"
  | "details-rate-limited"
  | "details-http-error"
  | "normalize-insufficient-results"
  | "network-error";

export interface RetrievalMeta {
  source: CandidateSource;
  fallbackReason?: RetrievalFallbackReason;
  attempts: number;
}

export interface RankingCandidateDebug {
  id: string;
  title: string;
  channel: string;
  durationMinutes: number;
  score: number;
}

export interface RankingMeta {
  strategy: "deterministic" | "hybrid-ai";
  aiUsed: boolean;
  aiAttempted: boolean;
  aiFailureReason?: string;
  feedbackAdjusted?: boolean;
  feedbackSamples?: number;
  shortlistSize: number;
  candidates: RankingCandidateDebug[];
}

export interface LearningSession {
  id: string;
  topic: string;
  filters: SessionFilters;
  selectedVideoId: string;
  backupVideoIds: string[];
  createdAt: string;
}

export interface Reflection {
  prompts: string[];
  response: string;
  durationSeconds: number;
  completedAt: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
  }>;
  correctOptionId: string;
}

export interface QuizAttempt {
  sessionId: string;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface LearningScore {
  sessionId: string;
  total: number;
  breakdown: {
    focus: number;
    recall: number;
    reasoning: number;
  };
  summary: string;
}

export interface SkipEvent {
  id: string;
  sessionId: string;
  stage: "session" | "watch";
  reason: string;
  skippedAt: string;
}

export interface SuggestionFeedback {
  id: string;
  sessionId: string;
  videoId: string;
  context: "initial-skip" | "post-quiz";
  rating: "good" | "neutral" | "bad";
  comment: string;
  submittedAt: string;
}

export interface DemoState {
  session: LearningSession;
  videoCandidates: VideoCandidate[];
  retrieval: RetrievalMeta;
  ranking: RankingMeta;
  watchProgress: {
    watchedSeconds: number;
    durationSeconds: number;
    watchCompletedAt: string | null;
  };
  reflection: Reflection | null;
  quizAttempt: QuizAttempt | null;
  learningScore: LearningScore | null;
  skipEvents: SkipEvent[];
  suggestionFeedback: SuggestionFeedback[];
}
