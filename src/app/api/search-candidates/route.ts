import { NextResponse } from "next/server";
import { searchYouTubeCandidates } from "@/lib/youtube/search-candidates";
import { SessionFilters } from "@/lib/types";

interface SearchCandidatesRequest {
  topic?: string;
  filters?: SessionFilters;
}

const isValidFilters = (filters: unknown): filters is SessionFilters => {
  if (!filters || typeof filters !== "object") return false;
  const f = filters as SessionFilters;
  const validDifficulty = ["beginner", "intermediate", "advanced"].includes(f.difficulty);
  const validMode = ["quick-answer", "full-tutorial"].includes(f.lessonMode);
  const validLength = Number.isFinite(f.maxLengthMinutes) && f.maxLengthMinutes >= 5 && f.maxLengthMinutes <= 120;
  return validDifficulty && validMode && validLength;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SearchCandidatesRequest;
  const topic = body.topic?.trim();
  const filters = body.filters;

  if (!topic || !isValidFilters(filters)) {
    return NextResponse.json({ error: "topic and filters are required" }, { status: 400 });
  }

  const result = await searchYouTubeCandidates(topic, filters);

  if (result.source === "mock") {
    console.warn("[search-candidates] fallback to mock", {
      topic,
      fallbackReason: result.fallbackReason ?? "unknown",
      attempts: result.attempts,
    });
  }

  return NextResponse.json(result);
}
