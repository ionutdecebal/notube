import { AppSectionPage } from "@/components/app-section-page";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <AppSectionPage
      eyebrow="Privacy"
      title="Privacy at NOTUBE"
      description="A plain-language overview of what the app stores, why it stores it, and where your control begins and ends."
    >
      <div className="space-y-4 text-sm text-zinc-300 sm:text-base">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">What we store</p>
          <p className="mt-2">
            NOTUBE stores the account details needed for sign-in, the lesson settings tied to your account, and the session data required
            to power history, stats, and resume links. That includes things like the topic you searched for, the lesson selected, watch
            progress, reflection completion, quiz results, and feedback you submit about lesson quality.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Why we store it</p>
          <p className="mt-2">
            The stored data exists to make the product work: to sync settings across devices, keep a record of what you have already
            studied, let you return to lessons, and improve future lesson selection over time.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Third-party services</p>
          <p className="mt-2">
            NOTUBE relies on external services to deliver core functionality, including YouTube for lesson sources, Neon for database and
            authentication infrastructure, Vercel for hosting, and model providers where AI ranking or quiz generation is enabled.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Your responsibility</p>
          <p className="mt-2">
            Do not submit confidential, regulated, or highly sensitive personal data through lesson topics, feedback, or account profile
            fields. The product is built for learning workflows, not secure records management.
          </p>
        </div>
      </div>
    </AppSectionPage>
  );
}
