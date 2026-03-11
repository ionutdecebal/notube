import { LearningSession, SessionFilters, VideoCandidate } from "@/lib/types";

export const DEFAULT_FILTERS: SessionFilters = {
  difficulty: "intermediate",
  lessonMode: "full-tutorial",
  maxLengthMinutes: 25,
};

export const createLearningSession = (
  topic: string,
  filters: SessionFilters,
  candidates: VideoCandidate[],
): LearningSession => ({
  id: crypto.randomUUID(),
  topic,
  filters,
  selectedVideoId: candidates[0]?.id ?? "",
  backupVideoIds: candidates.slice(1, 3).map((candidate) => candidate.id),
  createdAt: new Date().toISOString(),
});
