"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle.js";

/**
 * Split-screen layout used by /login and /register, matching design-reference auth screens.
 */
export function AuthLayout({ headline, subhead, children }) {
  return (
    <div className="ncc-ambient-glow grid min-h-screen bg-bg text-fg min-[860px]:grid-cols-[minmax(320px,460px)_1fr]">
      <aside className="flex flex-col justify-between gap-8 border-r border-border bg-brand-panel px-9 py-11 text-brand-panel-text max-[859px]:border-r-0 max-[859px]:border-b max-[859px]:px-6 max-[859px]:py-7">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-brand-panel-text no-underline">
            <span className="grid size-8 flex-none place-items-center rounded-xl bg-primary font-bold text-primary-text">
              N
            </span>
            <span className="leading-[1.1] font-semibold tracking-tight">
              NCC_DSA
              <span className="block text-[11px] font-medium tracking-wide text-brand-panel-muted uppercase">
                Student Platform
              </span>
            </span>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-3xl leading-[1.18] font-semibold tracking-tight">{headline}</h1>
          <p className="m-0 max-w-[38ch] text-sm leading-relaxed text-brand-panel-muted">{subhead}</p>
        </div>

        <dl className="m-0 grid grid-cols-3 gap-4 border-t border-white/15 pt-5 max-[480px]:grid-cols-1 max-[480px]:gap-3">
          <div>
            <dt className="text-xs font-medium text-brand-panel-muted">Tracks</dt>
            <dd className="m-0 mt-0.5 text-lg font-semibold tabular-nums">Individual &amp; Group</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-brand-panel-muted">Rating Scale</dt>
            <dd className="m-0 mt-0.5 text-lg font-semibold tabular-nums">1.00 – 5.00</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-brand-panel-muted">Standings</dt>
            <dd className="m-0 mt-0.5 text-lg font-semibold tabular-nums">Codeforces</dd>
          </div>
        </dl>
      </aside>

      <main className="relative flex items-center justify-center p-6 max-[480px]:p-4">
        <div className="absolute top-4 right-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
