import { DEFAULT_FILTERS } from "@/lib/session-defaults";
import { SessionFilters } from "@/lib/types";

export interface ParsedTopicInput {
  topic: string;
  filters: SessionFilters;
  preferencesRaw: string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseDuration = (value: string): number | null => {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const upperBound = Number(rangeMatch[2]);
    return clamp(upperBound, 5, 90);
  }

  const underMatch = normalized.match(/(?:under|<=?|max(?:imum)?)\s*(\d+)/);
  if (underMatch) {
    return clamp(Number(underMatch[1]), 5, 90);
  }

  const minuteMatch = normalized.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/);
  if (minuteMatch) {
    return clamp(Number(minuteMatch[1]), 5, 90);
  }

  if (/^\d+$/.test(normalized)) {
    return clamp(Number(normalized), 5, 90);
  }

  return null;
};

const parseDifficulty = (
  value: string,
): SessionFilters["difficulty"] | null => {
  const normalized = value.toLowerCase();
  if (/\bbeginner\b|\bintro\b|\bbasics?\b/.test(normalized)) return "beginner";
  if (/\bintermediate\b/.test(normalized)) return "intermediate";
  if (/\badvanced\b|\bexpert\b|\bdeep\b/.test(normalized)) return "advanced";
  return null;
};

const parseLessonMode = (
  value: string,
): SessionFilters["lessonMode"] | null => {
  const normalized = value.toLowerCase();
  if (/\bquick\b|\boverview\b|\bsummary\b|\bconcise\b/.test(normalized)) {
    return "quick-answer";
  }
  if (/\bfull\b|\btutorial\b|\bin-depth\b|\bdeep dive\b|\bdetailed\b/.test(normalized)) {
    return "full-tutorial";
  }
  return null;
};

export const parseTopicInput = (input: string): ParsedTopicInput => {
  const text = input.trim();
  const defaults = { ...DEFAULT_FILTERS };

  if (!text) {
    return { topic: "", filters: defaults, preferencesRaw: [] };
  }

  const match = text.match(/^(.*?)(?:\(([^()]*)\))?\s*$/);
  const topic = (match?.[1] ?? text).trim();
  const preferencesChunk = (match?.[2] ?? "").trim();
  const preferencesRaw = preferencesChunk
    ? preferencesChunk.split(",").map((part) => part.trim()).filter(Boolean)
    : [];

  const parsed: SessionFilters = { ...defaults };

  for (const pref of preferencesRaw) {
    const difficulty = parseDifficulty(pref);
    if (difficulty) parsed.difficulty = difficulty;

    const lessonMode = parseLessonMode(pref);
    if (lessonMode) parsed.lessonMode = lessonMode;

    const duration = parseDuration(pref);
    if (duration) parsed.maxLengthMinutes = duration;
  }

  return {
    topic: topic || text,
    filters: parsed,
    preferencesRaw,
  };
};
