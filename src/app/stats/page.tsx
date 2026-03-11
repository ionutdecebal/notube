import { AppSectionPage } from "@/components/app-section-page";
import { auth, neonAuthEnabled } from "@/lib/auth";
import { getUserStatsSummary } from "@/lib/server/user-history";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  if (!neonAuthEnabled || !auth) {
    return (
      <AppSectionPage
        eyebrow="Stats"
        title="Stats are unavailable on this deployment."
        description="Learning stats depend on account access, and this environment is missing the final setup."
      >
        <p className="text-sm text-zinc-300">Once account access is configured, this page will summarize your saved sessions.</p>
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
        description="Stats turn your saved sessions into a clearer picture of how you actually learn."
      >
        <p className="text-sm text-zinc-300">Sign in, complete a few sessions, and this page will start to fill in.</p>
      </AppSectionPage>
    );
  }

  const stats = await getUserStatsSummary(userId);

  return (
    <AppSectionPage
      eyebrow="Stats"
      title="Your stats."
      description="A simple view of completion, watch depth, quiz performance, and how often you needed extra explanation."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Sessions saved", value: stats.sessionCount },
          { label: "Sessions completed", value: stats.completedCount },
          { label: "Average quiz score", value: stats.averageQuizScore !== null ? `${stats.averageQuizScore}/100` : "N/A" },
          { label: "Average watch depth", value: `${stats.averageWatchPercent}%` },
          { label: "Backup paths opened", value: stats.backupOpenCount },
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
