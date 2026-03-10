"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { DEMO_QUIZ_QUESTIONS } from "@/lib/mock-data";
import { QuizQuestion } from "@/components/quiz-question";
import { calculateLearningScore } from "@/lib/scoring";
import { getDemoState, hydrateDemoStateFromServer, saveQuizAttempt } from "@/lib/session-storage";

export default function QuizDemoPage() {
  return (
    <Suspense fallback={<QuizPageFallback />}>
      <QuizDemoContent />
    </Suspense>
  );
}

function QuizDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState(() => getDemoState().session.id);

  useEffect(() => {
    const querySessionId = searchParams.get("sessionId");
    if (!querySessionId || querySessionId === sessionId) return;
    void hydrateDemoStateFromServer(querySessionId).then((next) => {
      if (next) setSessionId(next.session.id);
    });
  }, [searchParams, sessionId]);

  const allAnswered = useMemo(
    () => DEMO_QUIZ_QUESTIONS.every((question) => Boolean(answers[question.id])),
    [answers],
  );

  const onSubmit = () => {
    if (!allAnswered) return;

    const state = getDemoState();
    const scoreResult = calculateLearningScore(DEMO_QUIZ_QUESTIONS, answers);

    saveQuizAttempt(
      {
        sessionId: state.session.id,
        answers,
        submittedAt: new Date().toISOString(),
      },
      {
        sessionId: state.session.id,
        total: scoreResult.total,
        breakdown: scoreResult.breakdown,
        summary:
          "You demonstrated strong retention. Next, reinforce this by implementing one practical example from memory.",
      },
    );

    router.push(`/score/demo?sessionId=${encodeURIComponent(sessionId)}`);
  };

  return (
    <PageShell
      title="Quiz"
      description="Retrieval practice is one of the fastest ways to consolidate learning and reveal weak spots early."
    >
      <section className="space-y-4">
        <p className="text-sm text-zinc-300">
          Answer from memory first. The effort of recall is what strengthens long-term retention.
        </p>

        {DEMO_QUIZ_QUESTIONS.map((question) => (
          <QuizQuestion
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(optionId) =>
              setAnswers((prev) => ({
                ...prev,
                [question.id]: optionId,
              }))
            }
          />
        ))}

        <Button onClick={onSubmit} disabled={!allAnswered} className="w-full sm:w-auto">
          Submit answers
        </Button>
      </section>
    </PageShell>
  );
}

function QuizPageFallback() {
  return (
    <PageShell
      title="Quiz"
      description="Retrieval practice is one of the fastest ways to consolidate learning and reveal weak spots early."
    >
      <p className="text-sm text-zinc-400">Loading quiz...</p>
    </PageShell>
  );
}
