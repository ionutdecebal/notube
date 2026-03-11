import { AppSectionPage } from "@/components/app-section-page";

export default function AccountPage() {
  return (
    <AppSectionPage
      eyebrow="Account"
      title="Authentication will connect here."
      description="This page is the future home for sign in, profile details, and syncing history across devices."
    >
      <div className="space-y-3 text-sm text-zinc-300">
        <p>When auth is added, this section should stay lightweight: sign in, sign out, and basic account state.</p>
        <p className="text-zinc-500">For now there is no login flow wired up.</p>
      </div>
    </AppSectionPage>
  );
}
