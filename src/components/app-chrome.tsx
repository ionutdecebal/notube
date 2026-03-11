"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { href: "/", label: "Return to lesson" },
  { href: "/history", label: "History" },
  { href: "/stats", label: "Stats" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/account", label: "Account" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-full">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-900/90 bg-[#050608]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-100 transition-colors hover:text-white"
          >
            NOTUBE
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-10 items-center rounded-full border border-zinc-700 px-4 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            aria-expanded={menuOpen}
            aria-controls="app-menu"
          >
            Menu
          </button>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/45"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        id="app-menu"
        className={`fixed right-0 top-0 z-50 flex h-[100svh] w-[min(88vw,22rem)] flex-col border-l border-zinc-800 bg-[#090c11] px-5 pb-6 pt-20 shadow-2xl transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 border-b border-zinc-800 pb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Navigate</p>
        </div>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                  active
                    ? "border-zinc-200 bg-zinc-100 text-zinc-900"
                    : "border-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-950"
                }`}
              >
                {pathname === "/" && item.href === "/" ? "Lesson" : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="h-full pt-16">{children}</div>
    </div>
  );
}
