import { AppSectionPage } from "@/components/app-section-page";

export default function HowItWorksPage() {
  return (
    <AppSectionPage
      eyebrow="How it works"
      title="A rabbit hole, on rails."
      description="NOTUBE is built for people who still need YouTube to learn, but do not trust themselves inside the algorithm."
    >
      <div className="space-y-4 text-sm text-zinc-300 sm:text-base">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">What NOTUBE does</p>
          <p className="mt-2">
            YouTube is an incredible learning tool. It is also engineered to keep attention moving. That is the trap: you open it to learn
            one thing, and the algorithm turns that intention into a drift pattern. NOTUBE keeps the lesson and removes the feed.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Lesson selection</p>
          <p className="mt-2">
            Every session starts with one recommended lesson. Not ten tabs. Not a wall of thumbnails. One starting point chosen for fit,
            clarity, and length so the session begins with commitment instead of browsing.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Focused progression</p>
          <p className="mt-2">
            The flow is deliberate: watch, stop, think, then test. Reflection is part of the product because understanding usually feels
            solid right up until you have to explain it back to yourself. The quiz is there to verify, not entertain.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Progress that stays with you</p>
          <p className="mt-2">
            If the first lesson is not enough, NOTUBE opens exactly two paths: one simpler, one deeper. That is the product in one line:
            a rabbit hole, on rails. You can go further, but only with intent, and only inside a controlled frame.
          </p>
        </div>
      </div>
    </AppSectionPage>
  );
}
