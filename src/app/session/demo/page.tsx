"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MOCK_VIDEOS } from "@/lib/mock-data";
import { addSkipEvent, getDemoState, hydrateDemoStateFromServer } from "@/lib/session-storage";

export default function SessionDemoPage() {
  return (
    <Suspense fallback={<SessionPageFallback />}>
      <SessionDemoContent />
    </Suspense>
  );
}

function SessionDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState(() => getDemoState());
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (!sessionId || sessionId === state.session.id) return;
    void hydrateDemoStateFromServer(sessionId).then((next) => {
      if (next) setState(next);
    });
  }, [sessionId, state.session.id]);

  const video =
    state.videoCandidates.find((item) => item.id === state.session.selectedVideoId) ??
    state.videoCandidates[0] ??
    MOCK_VIDEOS[0];

  return (
    <PageShell title="Selected Lesson" description={`Best match for: ${state.session.topic}`}>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.1em] ${
              state.retrieval.source === "youtube"
                ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                : "border-amber-700 bg-amber-950 text-amber-300"
            }`}
          >
            Source: {state.retrieval.source}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs uppercase tracking-[0.1em] text-zinc-400">
            Attempts: {state.retrieval.attempts}
          </span>
          {state.retrieval.fallbackReason ? (
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs uppercase tracking-[0.1em] text-zinc-400">
              Fallback: {state.retrieval.fallbackReason}
            </span>
          ) : null}
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Selected video</p>
          <h2 className="text-xl font-semibold text-zinc-100">{video.title}</h2>
          <p className="text-sm text-zinc-400">
            {video.channel} • {video.durationMinutes} min
          </p>
          <p className="text-xs text-zinc-500">Session ID: {state.session.id}</p>
        </div>

        <p className="rounded-xl bg-zinc-950 px-4 py-3 text-sm text-zinc-300">{video.reasonSelected}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => router.push(`/watch/demo?sessionId=${encodeURIComponent(state.session.id)}`)}
            className="w-full sm:w-auto"
          >
            Start lesson
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              addSkipEvent({
                sessionId: getDemoState().session.id,
                stage: "session",
                reason: "User skipped selected lesson",
              });
              router.push("/");
            }}
          >
            Skip this pick
          </Button>
        </div>

        <details className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
          <summary className="cursor-pointer text-zinc-200">Ranking diagnostics</summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">
              Strategy: {state.ranking.strategy} • AI used: {state.ranking.aiUsed ? "yes" : "no"} • Shortlist:{" "}
              {state.ranking.shortlistSize}
            </p>
            <p className="text-xs text-zinc-500">
              AI attempted: {state.ranking.aiAttempted ? "yes" : "no"}
              {state.ranking.aiFailureReason ? ` • reason: ${state.ranking.aiFailureReason}` : ""}
            </p>
            <p className="text-xs text-zinc-500">
              Feedback-adjusted: {state.ranking.feedbackAdjusted ? "yes" : "no"} • samples:{" "}
              {state.ranking.feedbackSamples ?? 0}
            </p>
            {state.ranking.candidates.length > 0 ? (
              <ul className="space-y-2">
                {state.ranking.candidates.map((candidate) => (
                  <li key={candidate.id} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs">
                    <p className="text-zinc-200">{candidate.title}</p>
                    <p className="text-zinc-500">
                      score {candidate.score} • {candidate.channel} • {candidate.durationMinutes} min
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-500">No ranking diagnostics available for this run.</p>
            )}
          </div>
        </details>
      </Card>
    </PageShell>
  );
}

function SessionPageFallback() {
  return (
    <PageShell title="Selected Lesson" description="Loading lesson details...">
      <p className="text-sm text-zinc-400">Loading selected lesson...</p>
    </PageShell>
  );
}
