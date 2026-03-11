"use client";

import { AppSectionPage } from "@/components/app-section-page";
import { useUserSettings, writeUserSettings } from "@/lib/user-settings";

export default function AccountPage() {
  const settings = useUserSettings();
  const advancedEnabled = settings.quizMode === "advanced";

  return (
    <AppSectionPage
      eyebrow="Account"
      title="Authentication will connect here."
      description="This page is the future home for sign in, profile details, and syncing history across devices."
    >
      <div className="space-y-4 text-sm text-zinc-300">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Quiz mode</p>
              <p className="text-base text-zinc-100">Advanced quiz mode</p>
              <p className="text-sm text-zinc-400">
                Adds a longer quiz with four answer choices per question.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={advancedEnabled}
              onClick={() =>
                writeUserSettings({
                  quizMode: advancedEnabled ? "standard" : "advanced",
                })
              }
              className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border transition-colors ${
                advancedEnabled ? "border-zinc-200 bg-zinc-100" : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full transition-all ${
                  advancedEnabled ? "left-7 bg-zinc-900" : "left-1 bg-zinc-200"
                }`}
              />
            </button>
          </div>
        </div>
        <p>When auth is added, this section should stay lightweight: sign in, sign out, and basic account state.</p>
        <p className="text-zinc-500">For now there is no login flow wired up.</p>
      </div>
    </AppSectionPage>
  );
}
