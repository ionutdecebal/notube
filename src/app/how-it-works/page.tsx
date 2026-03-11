import { AppSectionPage } from "@/components/app-section-page";

export default function HowItWorksPage() {
  return (
    <AppSectionPage
      eyebrow="How it works"
      title="A calmer YouTube learning loop."
      description="How the product is meant to help you learn with less noise and more intention."
    >
      <div className="space-y-4 text-sm text-zinc-300 sm:text-base">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">App purpose</p>
          <p className="mt-2">
            YouTube is one of the most used platforms online, which makes it powerful for learning but also easy to drift on. Pew
            reports that 90% of U.S. teens use YouTube, 73% use it daily, and 15% say they use it almost constantly. NOTUBE is meant
            to reduce that pull toward endless browsing by narrowing the experience to one lesson, one reflection, and one quiz at a time.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Lesson selection</p>
          <p className="mt-2">A lesson is chosen from YouTube based on topic fit, duration, clarity signals, and what has worked better over time.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Backups</p>
          <p className="mt-2">Backups are there when you need a simpler or deeper angle, without throwing you into open-ended browsing.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">AI usage</p>
          <p className="mt-2">AI may help with ranking and quiz generation, but the product still starts from a constrained shortlist instead of infinite recommendations.</p>
        </div>
      </div>
    </AppSectionPage>
  );
}
