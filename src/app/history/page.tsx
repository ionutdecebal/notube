import Link from "next/link";
import { AppSectionPage } from "@/components/app-section-page";
import { auth, neonAuthEnabled } from "@/lib/auth";
import { getUserSessionSummaries } from "@/lib/server/user-history";

export const dynamic = "force-dynamic";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default async function HistoryPage() {
  if (!neonAuthEnabled || !auth) {
    return (
      <AppSectionPage
        eyebrow="History"
        title="History is not available on this deployment."
        description="Lesson history depends on account access, and this environment is missing the final auth configuration."
      >
        <p className="text-sm text-zinc-300">Once account access is configured, your saved lessons will appear here.</p>
      </AppSectionPage>
    );
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <AppSectionPage
        eyebrow="History"
        title="Sign in to view your lesson history."
        description="Every signed-in lesson is saved here with progress, score, and a direct path back into the session."
      >
        <p className="text-sm text-zinc-300">Sign in once, and your saved lessons will stay available across devices.</p>
      </AppSectionPage>
    );
  }

  const sessions = await getUserSessionSummaries(userId);

  return (
      <AppSectionPage
        eyebrow="History"
        title="Your lesson history."
        description="Review past sessions, see what stuck, and jump straight back into any lesson you want to continue."
      >
      {sessions.length === 0 ? (
        <p className="text-sm text-zinc-300">
          No saved lessons yet. Start a lesson while signed in and it will appear here automatically.
        </p>
      ) : (
        <div className="space-y-4">
          {sessions.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{entry.topic}</p>
                  <h2 className="text-lg text-zinc-100">{entry.selectedVideoTitle}</h2>
                  <p className="text-sm text-zinc-400">{entry.selectedVideoChannel}</p>
                </div>
                <div className="text-sm text-zinc-500 sm:text-right">
                  <p>Started {formatDate(entry.createdAt)}</p>
                  <p>Updated {formatDate(entry.updatedAt)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Watch</p>
                  <p className="mt-2 text-xl text-zinc-100">{entry.watchPercent}%</p>
                </div>
                <div className="rounded-xl border border-zinc-800 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Quiz</p>
                  <p className="mt-2 text-xl text-zinc-100">
                    {entry.quizScore !== null ? `${entry.quizScore}/100` : "Not taken"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Think mode</p>
                  <p className="mt-2 text-xl text-zinc-100">{entry.reflectionCompleted ? "Done" : "Pending"}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Backups opened</p>
                  <p className="mt-2 text-xl text-zinc-100">{entry.backupsOpened}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/?sessionId=${encodeURIComponent(entry.id)}`}
                  className="inline-flex rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-900"
                >
                  Open lesson
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppSectionPage>
  );
}
