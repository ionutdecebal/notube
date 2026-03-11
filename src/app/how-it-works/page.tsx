import { AppSectionPage } from "@/components/app-section-page";

export default function HowItWorksPage() {
  return (
    <AppSectionPage
      eyebrow="How it works"
      title="A rabbit hole, on rails."
      description="NOTUBE is for people who still need YouTube to learn, but do not want to hand the session over to the algorithm."
    >
      <div className="space-y-4 text-sm text-zinc-300 sm:text-base">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">What NOTUBE does</p>
          <p className="mt-2">
            YouTube is optimized to keep you watching. NOTUBE is optimized to help you understand. That is the whole idea. You still get
            the value of YouTube as a learning source, but without the feed, the recommendations, and the attention drift that usually
            comes with it.
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
            The session moves in one direction: watch, think, quiz, then choose whether to go deeper. That structure matters.
            Understanding usually feels solid while the video is playing. It becomes real when the video stops and you have to
            reconstruct it yourself.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Progress that stays with you</p>
          <p className="mt-2">
            If the first lesson is not enough, NOTUBE opens exactly two next steps: a simpler explanation and a deeper one. Not twenty
            recommendations. Not an infinite scroll of adjacent videos. Just enough room to explore with intent. A rabbit hole, on rails.
          </p>
        </div>
      </div>
    </AppSectionPage>
  );
}
