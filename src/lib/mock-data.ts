import {
  LearningScore,
  LearningSession,
  QuizQuestion,
  SessionFilters,
  VideoCandidate,
} from "@/lib/types";

export const DEFAULT_FILTERS: SessionFilters = {
  difficulty: "intermediate",
  lessonMode: "full-tutorial",
  maxLengthMinutes: 25,
};

export const MOCK_VIDEOS: VideoCandidate[] = [
  {
    id: "v-primary-001",
    title: "TypeScript in 30 Minutes: Practical Patterns for Real Projects",
    channel: "Code Academy Lab",
    durationMinutes: 24,
    role: "primary",
    reasonSelected:
      "Clear structure, practical examples, and high signal-to-noise for focused learning.",
    videoUrl: "https://www.youtube.com/watch?v=mock-primary",
  },
  {
    id: "v-backup-001",
    title: "TypeScript Fundamentals for Beginners",
    channel: "Plain Dev",
    durationMinutes: 18,
    role: "backup-simpler",
    reasonSelected: "Simpler pace with step-by-step framing for quick reinforcement.",
    videoUrl: "https://www.youtube.com/watch?v=mock-backup-simple",
  },
  {
    id: "v-backup-002",
    title: "Advanced TypeScript Design Decisions",
    channel: "Engineering Depth",
    durationMinutes: 32,
    role: "backup-deeper",
    reasonSelected: "Deeper conceptual treatment and design tradeoff discussion.",
    videoUrl: "https://www.youtube.com/watch?v=mock-backup-deep",
  },
];

export const DEMO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "What is the main goal of using TypeScript in a codebase?",
    options: [
      { id: "a", label: "To make JavaScript run faster at runtime" },
      { id: "b", label: "To add static typing and improve maintainability" },
      { id: "c", label: "To remove the need for tests" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q2",
    prompt: "When should you prefer a union type?",
    options: [
      { id: "a", label: "When a value can be one of several known shapes" },
      { id: "b", label: "When you want to disable type checking" },
      { id: "c", label: "Only for numbers" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q3",
    prompt: "Why is narrowing important in TypeScript?",
    options: [
      { id: "a", label: "It reduces file size" },
      { id: "b", label: "It helps TypeScript infer safer operations by type guards" },
      { id: "c", label: "It converts all types into strings" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q4",
    prompt: "What does `strict` mode generally enforce?",
    options: [
      { id: "a", label: "Looser checks for faster builds" },
      { id: "b", label: "Stronger compile-time checks to catch bugs earlier" },
      { id: "c", label: "Automatic code formatting" },
    ],
    correctOptionId: "b",
  },
];

export const buildDemoSession = (
  topic: string,
  filters: SessionFilters,
  candidates: VideoCandidate[],
): LearningSession => ({
  id: crypto.randomUUID(),
  topic,
  filters,
  selectedVideoId: candidates[0]?.id ?? MOCK_VIDEOS[0].id,
  backupVideoIds: [
    candidates[1]?.id ?? MOCK_VIDEOS[1].id,
    candidates[2]?.id ?? MOCK_VIDEOS[2].id,
  ],
  createdAt: new Date().toISOString(),
});

export const DEFAULT_SCORE: LearningScore = {
  sessionId: "demo-template",
  total: 84,
  breakdown: {
    focus: 88,
    recall: 80,
    reasoning: 84,
  },
  summary:
    "You captured the core TypeScript patterns and showed strong conceptual recall. Next, practice applying unions and narrowing in a small real project.",
};
