"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDemoState, getLearningScoreOrDefault, hydrateDemoStateFromServer } from "@/lib/session-storage";

export default function ScoreDemoPage() {
  return (
    <Suspense fallback={<ScorePageFallback />}>
      <ScoreDemoContent />
    </Suspense>
  );
}

function ScoreDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [score] = useState(() => getLearningScoreOrDefault());
  const [sessionId, setSessionId] = useState(() => getDemoState().session.id);

  useEffect(() => {
    const querySessionId = searchParams.get("sessionId");
    if (!querySessionId || querySessionId === sessionId) return;
    void hydrateDemoStateFromServer(querySessionId).then((next) => {
      if (next) setSessionId(next.session.id);
    });
  }, [searchParams, sessionId]);

  return (
    <PageShell
      title="Learning Score"
      description="Your score combines focus, recall, and reasoning from this lesson cycle."
    >
      <Card className="space-y-5">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-5 text-zinc-100">
          <p className="text-sm text-zinc-400">Learning Score</p>
          <p className="text-4xl font-semibold tracking-tight">{score.total}/100</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Focus" value={score.breakdown.focus} />
          <Metric label="Recall" value={score.breakdown.recall} />
          <Metric label="Reasoning" value={score.breakdown.reasoning} />
        </div>

        <p className="text-sm text-zinc-300">{score.summary}</p>

        <Button onClick={() => router.push(`/backups/demo?sessionId=${encodeURIComponent(sessionId)}`)}>
          Unlock backup lessons
        </Button>
      </Card>
    </PageShell>
  );
}

function ScorePageFallback() {
  return (
    <PageShell
      title="Learning Score"
      description="Your score combines focus, recall, and reasoning from this lesson cycle."
    >
      <p className="text-sm text-zinc-400">Loading score...</p>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
