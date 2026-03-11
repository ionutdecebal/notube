interface AppSectionPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AppSectionPage({ eyebrow, title, description, children }: AppSectionPageProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-5 sm:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight text-zinc-100 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
