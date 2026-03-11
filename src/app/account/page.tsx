import { AppSectionPage } from "@/components/app-section-page";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { signInAction, signOutAction, signUpAction } from "@/app/account/actions";
import { auth, neonAuthEnabled } from "@/lib/auth";
import { getUserSettings } from "@/lib/server/user-settings";

export const dynamic = "force-dynamic";

interface AccountPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;

  if (!neonAuthEnabled || !auth) {
    return (
      <AppSectionPage
        eyebrow="Account"
        title="Finish auth configuration."
        description="Neon Auth is enabled in Neon, but this app still needs the auth base URL exposed to the app before sign-in can work."
      >
        <div className="space-y-4 text-sm text-zinc-300">
          <p>Add `NEON_AUTH_BASE_URL` to Vercel and local envs with the value of your Neon auth URL.</p>
          <p className="text-zinc-500">
            Neon already added `VITE_NEON_AUTH_URL`, but this server-side SDK expects `NEON_AUTH_BASE_URL`.
          </p>
        </div>
      </AppSectionPage>
    );
  }

  const { data: session } = await auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return (
      <AppSectionPage
        eyebrow="Account"
        title="Sign in to unlock synced settings."
        description="Advanced quiz mode is now an account feature, so sign in to enable and sync it."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Sign in</p>
              <h2 className="text-lg text-zinc-100">Welcome back</h2>
            </div>
            <form action={signInAction} className="space-y-3">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full rounded-xl border border-zinc-800 bg-transparent px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full rounded-xl border border-zinc-800 bg-transparent px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-zinc-900"
              >
                Sign in
              </button>
            </form>
          </section>

          <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Create account</p>
              <h2 className="text-lg text-zinc-100">Enable account-only settings</h2>
            </div>
            <form action={signUpAction} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Name (optional)"
                className="w-full rounded-xl border border-zinc-800 bg-transparent px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full rounded-xl border border-zinc-800 bg-transparent px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full rounded-xl border border-zinc-800 bg-transparent px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-zinc-900"
              >
                Create account
              </button>
            </form>
          </section>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        ) : null}
      </AppSectionPage>
    );
  }

  const settings = await getUserSettings(user.id);

  return (
    <AppSectionPage
      eyebrow="Account"
      title={user.name ? `${user.name}, your settings are synced.` : "Your settings are synced."}
      description="Advanced quiz mode is only available when you are signed in, and it will follow your account across devices."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm text-zinc-300">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Signed in as</p>
          <p className="mt-2 text-base text-zinc-100">{user.email}</p>
        </div>

        <AccountSettingsPanel initialQuizMode={settings.quizMode} />

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </AppSectionPage>
  );
}
