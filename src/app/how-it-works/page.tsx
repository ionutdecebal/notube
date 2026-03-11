import { AppSectionPage } from "@/components/app-section-page";

export default function HowItWorksPage() {
  return (
    <AppSectionPage
      eyebrow="How it works"
      title="Escape the YouTube algorithm. Keep the knowledge."
      description="NOTUBE is designed to protect attention while keeping the depth and usefulness of YouTube as a learning source."
    >
      <div className="space-y-4 text-sm text-zinc-300 sm:text-base">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">What NOTUBE does</p>
          <p className="mt-2">
            YouTube is one of the best places to learn a skill, but it is also built to keep you moving from one recommendation to the next.
            NOTUBE narrows that experience into a deliberate study flow: choose a topic, commit to one lesson, reflect on it, and test what
            you retained before opening anything else.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Lesson selection</p>
          <p className="mt-2">
            Each session starts with a single recommended lesson chosen for topic fit, length, clarity, and what has performed best for
            similar searches.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Focused progression</p>
          <p className="mt-2">
            After watching, Think Mode forces a short pause for recall. The quiz checks whether the lesson actually landed. Backup videos
            stay available, but only as deliberate alternatives instead of a recommendation feed.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Progress that stays with you</p>
          <p className="mt-2">
            Signed-in sessions save your settings, history, stats, and the point you reached in a lesson so you can return without starting
            from scratch.
          </p>
        </div>
      </div>
    </AppSectionPage>
  );
}
