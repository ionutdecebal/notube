import { AppSectionPage } from "@/components/app-section-page";

export default function StatsPage() {
  return (
    <AppSectionPage
      eyebrow="Stats"
      title="Learning stats will land here."
      description="This page can eventually track watch completion, quiz accuracy, return rate, and how often backups are needed."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {["Sessions completed", "Average quiz score", "Backup opens"].map((item) => (
          <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{item}</p>
            <p className="mt-3 text-2xl font-medium text-zinc-200">Coming soon</p>
          </div>
        ))}
      </div>
    </AppSectionPage>
  );
}
