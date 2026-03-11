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

const fallbackQuestions = (context: QuizContext): QuizQuestion[] => {
  const t = context.topic;
  if (context.quizMode === "advanced") {
    return [
      buildThreeOptionQuestion(
        "q1",
        `What is the most basic goal of learning ${t}?`,
        `To understand the core idea well enough to use it intentionally`,
        [
          `To collect terms without using them`,
          `To move on quickly without checking understanding`,
        ],
      ),
      buildThreeOptionQuestion(
        "q2",
        `What is the best first step after watching a lesson on ${t}?`,
        "Test it in a small practical example and inspect the outcome",
        [
          "Avoid practice until every detail is memorized",
          "Jump straight to the hardest use case",
        ],
      ),
      buildThreeOptionQuestion(
        "q3",
        `Which habit would most hurt your retention of ${t}?`,
        "Passive watching without checking whether you can explain it back",
        [
          "Summarizing the key idea after the lesson",
          "Revisiting the topic with a second example",
        ],
      ),
      buildThreeOptionQuestion(
        "q4",
        `What best shows that you understand ${t} at a practical level?`,
        "You can explain it clearly and apply it to a new example",
        [
          "You can recall one isolated phrase",
          "You watched two related videos in a row",
        ],
      ),
      buildThreeOptionQuestion(
        "q5",
        `When applying ${t}, what matters more than memorizing definitions?`,
        "Knowing when and why to use the idea in context",
        [
          "Repeating the same summary word for word",
          "Avoiding any variation from the original example",
        ],
      ),
      buildThreeOptionQuestion(
        "q6",
        `Which mistake suggests shallow understanding of ${t}?`,
        "Using the idea without checking whether the assumptions still hold",
        [
          "Testing the idea on a second example",
          "Comparing two plausible interpretations",
        ],
      ),
      buildThreeOptionQuestion(
        "q7",
        `What would be the strongest sign that ${t} transfers beyond the original lesson?`,
        "You can adapt the idea to a new case with different surface details",
        [
          "You can repeat the original example perfectly",
          "You can list the chapter titles in order",
        ],
      ),
      buildThreeOptionQuestion(
        "q8",
        `If two approaches to ${t} both seem plausible, what should you do next?`,
        "Compare the tradeoffs and choose based on the problem context",
        [
          "Assume the first one mentioned is always best",
          "Avoid making a choice until you find a single universal rule",
        ],
      ),
      buildThreeOptionQuestion(
        "q9",
        `What kind of question shows deeper mastery of ${t}?`,
        "Asking where the method breaks, not just where it works",
        [
          "Asking how to memorize the explanation faster",
          "Asking how to finish the lesson without pausing",
        ],
      ),
      buildThreeOptionQuestion(
        "q10",
        `What is the strongest final test of whether you truly understand ${t}?`,
        "You can explain the idea, apply it, and predict where it may fail",
        [
          "You remember the thumbnail and title of the lesson",
          "You can recognize the topic name in a list",
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
  questions.length >= (quizMode === "advanced" ? 10 : 3) &&
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
              'Return strict JSON only with shape {"questions":[...]} where each question has exactly 3 options. Use option ids a,b,c.',
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                context.quizMode === "advanced"
                  ? "Create 10 multiple-choice questions that progressively increase in difficulty from basic recall to transfer, tradeoffs, edge cases, and failure analysis. Exactly 3 options per question. One correct option."
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
    const optionCount = 3;
    const questionCount = context.quizMode === "advanced" ? 10 : 3;
    const questions = (parsed.questions ?? []).slice(0, questionCount).map((question, index) => ({
      id: question.id || `q${index + 1}`,
      prompt: question.prompt,
      options: question.options.slice(0, optionCount).map((option, optionIndex) => ({
        id: option.id || (optionIndex === 0 ? "a" : optionIndex === 1 ? "b" : "c"),
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
