interface PageShellProps {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-400">{title}</p>
        {description ? (
          typeof description === "string" ? (
            <p className="max-w-2xl text-sm text-zinc-400">{description}</p>
          ) : (
            <div className="max-w-2xl text-sm text-zinc-400">{description}</div>
          )
        ) : null}
      </header>
      {children}
    </main>
  );
}
