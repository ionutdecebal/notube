import Link from "next/link";
import { AppSectionPage } from "@/components/app-section-page";

export default function HistoryPage() {
  return (
    <AppSectionPage
      eyebrow="History"
      title="Session history will live here."
      description="Later this page can show previous lessons, quiz outcomes, and quick links back into unfinished sessions."
    >
      <div className="space-y-4 text-sm text-zinc-300">
        <p>For now, history is not surfaced yet. The layout is in place so we can add it without crowding the lesson flow.</p>
        <Link href="/" className="inline-flex rounded-xl border border-zinc-700 px-4 py-2 text-zinc-100 transition-colors hover:border-zinc-500">
          Return to lesson
        </Link>
      </div>
    </AppSectionPage>
  );
}
