import "server-only";

import { QuizQuestion, SessionFilters } from "@/lib/types";

const OPENAI_API_BASE = "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

interface QuizContext {
  topic: string;
  filters: SessionFilters;
  selectedVideo: {
    title: string;
    channel: string;
    reasonSelected: string;
  };
}

export interface QuizGenerationMeta {
  source: "ai" | "fallback";
  basis: "video-specific" | "general-topic";
}

interface QuizGenerationResult {
  questions: QuizQuestion[];
  meta: QuizGenerationMeta;
}

const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const buildThreeOptionQuestion = (
  id: string,
  prompt: string,
  correct: string,
  distractors: [string, string],
): QuizQuestion => {
  const raw = shuffle([
    { id: "a", label: correct, isCorrect: true },
    { id: "b", label: distractors[0], isCorrect: false },
    { id: "c", label: distractors[1], isCorrect: false },
  ]);
  const options = raw.map((item, idx) => ({
    id: idx === 0 ? "a" : idx === 1 ? "b" : "c",
    label: item.label,
  }));
  const correctOption = raw.find((item) => item.isCorrect);

  return {
    id,
    prompt,
    options,
    correctOptionId:
      options.find((option) => option.label === correctOption?.label)?.id ?? "a",
  };
};

const fallbackQuestions = (context: QuizContext): QuizQuestion[] => {
  const t = context.topic;
  return [
    buildThreeOptionQuestion(
      "q1",
      `What is the core idea behind ${t}?`,
      `A clear foundational explanation of ${t}`,
      [`${t} has no practical applications`, `${t} is only useful for experts`],
    ),
    buildThreeOptionQuestion(
      "q2",
      `What is a good first step to apply ${t}?`,
      "Try a small practical example immediately",
      ["Avoid practice and only memorize terms", "Skip fundamentals and jump to edge cases"],
    ),
    buildThreeOptionQuestion(
      "q3",
      `Which approach most improves understanding of ${t}?`,
      "Active recall and short repetition cycles",
      ["Passive watching without reflection", "Changing topics before mastery"],
    ),
  ];
};

const isValidQuiz = (questions: QuizQuestion[]): boolean =>
  questions.length >= 3 &&
  questions.every(
    (question) =>
      question.prompt.trim().length > 0 &&
      question.options.length === 3 &&
      question.options.every((option) => option.id && option.label.trim().length > 0) &&
      question.options.some((option) => option.id === question.correctOptionId),
  );

export const generateQuizQuestions = async (
  context: QuizContext,
): Promise<QuizGenerationResult> => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      questions: fallbackQuestions(context),
      meta: { source: "fallback", basis: "general-topic" },
    };
  }

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Return strict JSON only with shape {\"questions\":[...]} where each question has exactly 3 options. Use option ids a,b,c.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Create 3 multiple-choice questions to test retention and understanding. Exactly 3 options per question. One correct option.",
              context,
              outputSchema: {
                questions: [
                  {
                    id: "q1",
                    prompt: "string",
                    options: [
                      { id: "a", label: "string" },
                      { id: "b", label: "string" },
                      { id: "c", label: "string" },
                    ],
                    correctOptionId: "a|b|c",
                  },
                ],
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        questions: fallbackQuestions(context),
        meta: { source: "fallback", basis: "general-topic" },
      };
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return {
        questions: fallbackQuestions(context),
        meta: { source: "fallback", basis: "general-topic" },
      };
    }

    const parsed = JSON.parse(content) as {
      questions?: QuizQuestion[];
    };
    const questions = (parsed.questions ?? []).slice(0, 3).map((question, index) => ({
      id: question.id || `q${index + 1}`,
      prompt: question.prompt,
      options: question.options.slice(0, 3).map((option, optionIndex) => ({
        id: option.id || (optionIndex === 0 ? "a" : optionIndex === 1 ? "b" : "c"),
        label: option.label,
      })),
      correctOptionId: question.correctOptionId,
    }));

    if (!isValidQuiz(questions)) {
      return {
        questions: fallbackQuestions(context),
        meta: { source: "fallback", basis: "general-topic" },
      };
    }
    return {
      questions,
      meta: { source: "ai", basis: "video-specific" },
    };
  } catch {
    return {
      questions: fallbackQuestions(context),
      meta: { source: "fallback", basis: "general-topic" },
    };
  }
};
