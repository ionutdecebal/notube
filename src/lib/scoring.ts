import { QuizQuestion } from "@/lib/types";

export const calculateLearningScore = (
  questions: QuizQuestion[],
  answers: Record<string, string>,
) => {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      total: 0,
      breakdown: { focus: 0, recall: 0, reasoning: 0 },
    };
  }

  const correctCount = questions.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length;

  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const focus = Math.max(55, Math.min(100, accuracy + 6));
  const recall = accuracy;
  const reasoning = Math.max(50, Math.min(100, accuracy + 2));
  const total = Math.round((focus + recall + reasoning) / 3);

  return {
    total,
    breakdown: { focus, recall, reasoning },
  };
};
