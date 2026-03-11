"use client";

import { useState, useTransition } from "react";
import { QuizMode } from "@/lib/types";

interface AccountSettingsPanelProps {
  initialQuizMode: QuizMode;
}

export function AccountSettingsPanel({ initialQuizMode }: AccountSettingsPanelProps) {
  const [quizMode, setQuizMode] = useState<QuizMode>(initialQuizMode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const advancedEnabled = quizMode === "advanced";

  const toggleQuizMode = () => {
    const nextQuizMode: QuizMode = advancedEnabled ? "standard" : "advanced";
    setError(null);
    setQuizMode(nextQuizMode);

    startTransition(async () => {
      try {
        const response = await fetch("/api/user-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quizMode: nextQuizMode }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          setQuizMode(advancedEnabled ? "advanced" : "standard");
          setError(payload.error ?? "Could not save your settings.");
          return;
        }
      } catch {
        setQuizMode(advancedEnabled ? "advanced" : "standard");
        setError("Could not save your settings.");
      }
    });
  };

  return (
    <div className="space-y-4 text-sm text-zinc-300">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Quiz mode</p>
            <p className="text-base text-zinc-100">Advanced quiz mode</p>
            <p className="text-sm text-zinc-400">
              Enables a 10-question quiz that starts easy and becomes much harder.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={advancedEnabled}
            aria-busy={isPending}
            onClick={toggleQuizMode}
            className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border transition-colors ${
              advancedEnabled ? "border-zinc-200 bg-zinc-100" : "border-zinc-700 bg-zinc-900"
            } ${isPending ? "opacity-70" : ""}`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full transition-all ${
                advancedEnabled ? "left-7 bg-zinc-900" : "left-1 bg-zinc-200"
              }`}
            />
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">
          {error}
        </p>
      ) : null}

      <p>Your quiz preference is synced to your account and will follow you across devices.</p>
    </div>
  );
}
