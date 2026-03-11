import { AppSectionPage } from "@/components/app-section-page";

export const metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <AppSectionPage
      eyebrow="Terms"
      title="Terms of use"
      description="The practical rules for using NOTUBE as a learning product."
    >
      <div className="space-y-4 text-sm text-zinc-300 sm:text-base">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Use of the product</p>
          <p className="mt-2">
            NOTUBE is provided as a learning tool that helps you move through YouTube lessons in a focused workflow. You are responsible
            for how you use the product, the topics you search for, and the content you decide to study.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Content and availability</p>
          <p className="mt-2">
            Lesson recommendations depend on third-party content and external services. NOTUBE cannot guarantee that any specific YouTube
            video, channel, search result, or AI-generated quiz output will always be available, complete, or error-free.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Accounts and access</p>
          <p className="mt-2">
            If you create an account, you are responsible for maintaining the security of that account and for any activity that happens
            under it. We may suspend or restrict access if the product is abused, attacked, or used in a way that risks service
            reliability.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">No guarantees</p>
          <p className="mt-2">
            NOTUBE is intended to improve learning focus and recall, but it does not promise any specific educational outcome, business
            result, certification, or performance improvement.
          </p>
        </div>
      </div>
    </AppSectionPage>
  );
}
