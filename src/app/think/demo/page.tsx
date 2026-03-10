"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDemoState, hydrateDemoStateFromServer, saveReflection } from "@/lib/session-storage";

const THINK_SECONDS = 60;

const prompts = [
  "What is the single most important idea from this lesson?",
  "Where could this concept fail if applied incorrectly?",
  "What concrete action will you take today to apply this?",
];

export default function ThinkDemoPage() {
  return (
    <Suspense fallback={<ThinkPageFallback />}>
      <ThinkDemoContent />
    </Suspense>
  );
}

function ThinkDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(THINK_SECONDS);
  const [isActiveWindow, setIsActiveWindow] = useState(true);
  const [reflectionText, setReflectionText] = useState("");
  const [sessionId, setSessionId] = useState(() => getDemoState().session.id);

  useEffect(() => {
    const syncWindowState = () => {
      setIsActiveWindow(!document.hidden && document.hasFocus());
    };

    syncWindowState();
    window.addEventListener("focus", syncWindowState);
    window.addEventListener("blur", syncWindowState);
    document.addEventListener("visibilitychange", syncWindowState);

    return () => {
      window.removeEventListener("focus", syncWindowState);
      window.removeEventListener("blur", syncWindowState);
      document.removeEventListener("visibilitychange", syncWindowState);
    };
  }, []);

  useEffect(() => {
    const querySessionId = searchParams.get("sessionId");
    if (!querySessionId || querySessionId === sessionId) return;
    void hydrateDemoStateFromServer(querySessionId).then((next) => {
      if (next) setSessionId(next.session.id);
    });
  }, [searchParams, sessionId]);

  useEffect(() => {
    if (!isActiveWindow) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActiveWindow]);

  const done = secondsLeft === 0;
  const mmss = useMemo(() => {
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const seconds = String(secondsLeft % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const onContinue = () => {
    saveReflection({
      prompts,
      response: reflectionText,
      durationSeconds: THINK_SECONDS,
      completedAt: new Date().toISOString(),
    });
    router.push(`/quiz/demo?sessionId=${encodeURIComponent(sessionId)}`);
  };

  return (
    <PageShell
      title="Think Mode"
      description="Pausing to reflect strengthens memory encoding and improves transfer into real-world use."
    >
      <Card className="space-y-5">
        <div className="flex items-center justify-between rounded-xl bg-zinc-950 px-4 py-3">
          <p className="text-sm text-zinc-400">Time remaining</p>
          <p className="text-2xl font-semibold tracking-tight text-zinc-100">{mmss}</p>
        </div>

        {!isActiveWindow && !done ? (
          <p className="text-sm text-amber-300">Timer paused while this window is out of focus.</p>
        ) : null}

        <p className="text-sm text-zinc-300">
          One minute of deliberate recall helps convert passive watching into durable understanding.
        </p>

        <ul className="space-y-2 text-sm text-zinc-300">
          {prompts.map((prompt) => (
            <li key={prompt} className="rounded-lg border border-zinc-700 px-3 py-2">
              {prompt}
            </li>
          ))}
        </ul>

        <textarea
          value={reflectionText}
          onChange={(event) => setReflectionText(event.target.value)}
          placeholder="Write your reflection..."
          className="min-h-36 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-300"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onContinue} disabled={!done} className="w-full sm:w-auto">
            Continue to quiz
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => router.push(`/watch/demo?sessionId=${encodeURIComponent(sessionId)}`)}
          >
            Back to video
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

function ThinkPageFallback() {
  return (
    <PageShell
      title="Think Mode"
      description="Pausing to reflect strengthens memory encoding and improves transfer into real-world use."
    >
      <p className="text-sm text-zinc-400">Loading think mode...</p>
    </PageShell>
  );
}
