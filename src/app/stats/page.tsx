import { AppSectionPage } from "@/components/app-section-page";
import { auth, neonAuthEnabled } from "@/lib/auth";
import { getUserStatsSummary } from "@/lib/server/user-history";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  if (!neonAuthEnabled || !auth) {
    return (
      <AppSectionPage
        eyebrow="Stats"
        title="Stats unlock with your account."
        description="Once auth is configured on this deployment, this page will summarize your signed-in learning activity."
      >
        <p className="text-sm text-zinc-300">Auth is not configured yet for this deployment.</p>
      </AppSectionPage>
    );
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <AppSectionPage
        eyebrow="Stats"
        title="Sign in to see your learning stats."
        description="Stats are calculated from your saved, signed-in sessions."
      >
        <p className="text-sm text-zinc-300">Sign in first, then complete a few lessons to populate this page.</p>
      </AppSectionPage>
    );
  }

  const stats = await getUserStatsSummary(userId);

  return (
    <AppSectionPage
      eyebrow="Stats"
      title="Your learning stats."
      description="This is a first pass over your signed-in session data: completion, quiz performance, watch depth, and how often you needed backups."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Sessions saved", value: stats.sessionCount },
          { label: "Sessions completed", value: stats.completedCount },
          { label: "Average quiz score", value: stats.averageQuizScore !== null ? `${stats.averageQuizScore}/100` : "N/A" },
          { label: "Average watch depth", value: `${stats.averageWatchPercent}%` },
          { label: "Backup opens", value: stats.backupOpenCount },
          { label: "Feedback events", value: stats.feedbackCount },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{item.label}</p>
            <p className="mt-3 text-2xl font-medium text-zinc-200">{item.value}</p>
          </div>
        ))}
      </div>
    </AppSectionPage>
  );
}
