import { NextResponse } from "next/server";
import { generateQuizQuestions } from "@/lib/quiz/generate-quiz";
import { QuizMode, SessionFilters } from "@/lib/types";

interface GenerateQuizRequest {
  topic?: string;
  filters?: SessionFilters;
  quizMode?: QuizMode;
  selectedVideo?: {
    title?: string;
    channel?: string;
    reasonSelected?: string;
  };
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
  const body = (await request.json()) as GenerateQuizRequest;
  const topic = body.topic?.trim();
  const filters = body.filters;
  const quizMode = body.quizMode === "advanced" ? "advanced" : "standard";
  const selectedVideo = body.selectedVideo;

  if (!topic || !isValidFilters(filters) || !selectedVideo?.title || !selectedVideo.channel || !selectedVideo.reasonSelected) {
    return NextResponse.json({ error: "topic, filters, and selectedVideo are required" }, { status: 400 });
  }

  const result = await generateQuizQuestions({
    topic,
    filters,
    quizMode,
    selectedVideo: {
      title: selectedVideo.title,
      channel: selectedVideo.channel,
      reasonSelected: selectedVideo.reasonSelected,
    },
  });

  return NextResponse.json(result);
}
