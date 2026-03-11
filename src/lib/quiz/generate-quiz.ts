import "server-only";

import { QuizMode, QuizQuestion, SessionFilters } from "@/lib/types";

const OPENAI_API_BASE = "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

interface QuizContext {
  topic: string;
  filters: SessionFilters;
  quizMode: QuizMode;
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

const buildFourOptionQuestion = (
  id: string,
  prompt: string,
  correct: string,
  distractors: [string, string, string],
): QuizQuestion => {
  const raw = shuffle([
    { id: "a", label: correct, isCorrect: true },
    { id: "b", label: distractors[0], isCorrect: false },
    { id: "c", label: distractors[1], isCorrect: false },
    { id: "d", label: distractors[2], isCorrect: false },
  ]);
  const options = raw.map((item, idx) => ({
    id: idx === 0 ? "a" : idx === 1 ? "b" : idx === 2 ? "c" : "d",
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
  if (context.quizMode === "advanced") {
    return [
      buildFourOptionQuestion(
        "q1",
        `Which statement best captures the main idea behind ${t}?`,
        `It identifies the core principle that makes ${t} work`,
        [
          `${t} only matters for experts`,
          `${t} is mostly terminology without application`,
          `${t} has one fixed pattern for every situation`,
        ],
      ),
      buildFourOptionQuestion(
        "q2",
        `What is the strongest first step to apply ${t}?`,
        "Test it in a small practical example and inspect the outcome",
        [
          "Avoid practice until every detail is memorized",
          "Jump straight to the hardest use case",
          "Focus only on definitions and skip experiments",
        ],
      ),
      buildFourOptionQuestion(
        "q3",
        `Which habit would most weaken learning retention for ${t}?`,
        "Passive watching without checking whether you can explain it back",
        [
          "Summarizing the key idea after the lesson",
          "Comparing two valid approaches",
          "Revisiting the topic with a second example",
        ],
      ),
      buildFourOptionQuestion(
        "q4",
        `What evidence would best show a strong understanding of ${t}?`,
        "You can explain it clearly and apply it to a new example",
        [
          "You finished the lesson without pausing",
          "You can recall one isolated phrase",
          "You watched two related videos in a row",
        ],
      ),
    ];
  }
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

const isValidQuiz = (questions: QuizQuestion[], quizMode: QuizMode): boolean =>
  questions.length >= (quizMode === "advanced" ? 4 : 3) &&
  questions.every(
    (question) =>
      question.prompt.trim().length > 0 &&
      question.options.length === (quizMode === "advanced" ? 4 : 3) &&
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
            content: `Return strict JSON only with shape {"questions":[...]} where each question has exactly ${
              context.quizMode === "advanced" ? 4 : 3
            } options. Use option ids ${context.quizMode === "advanced" ? "a,b,c,d" : "a,b,c"}.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                context.quizMode === "advanced"
                  ? "Create 4 more demanding multiple-choice questions to test retention, transfer, and reasoning. Exactly 4 options per question. One correct option."
                  : "Create 3 multiple-choice questions to test retention and understanding. Exactly 3 options per question. One correct option.",
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
                      ...(context.quizMode === "advanced" ? [{ id: "d", label: "string" }] : []),
                    ],
                    correctOptionId: context.quizMode === "advanced" ? "a|b|c|d" : "a|b|c",
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
    const optionCount = context.quizMode === "advanced" ? 4 : 3;
    const questionCount = context.quizMode === "advanced" ? 4 : 3;
    const questions = (parsed.questions ?? []).slice(0, questionCount).map((question, index) => ({
      id: question.id || `q${index + 1}`,
      prompt: question.prompt,
      options: question.options.slice(0, optionCount).map((option, optionIndex) => ({
        id:
          option.id ||
          (optionIndex === 0 ? "a" : optionIndex === 1 ? "b" : optionIndex === 2 ? "c" : "d"),
        label: option.label,
      })),
      correctOptionId: question.correctOptionId,
    }));

    if (!isValidQuiz(questions, context.quizMode)) {
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
