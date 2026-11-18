"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle.js";

/**
 * Split-screen layout used by /login and /register, matching design-reference/design auth screens.
 */
export function AuthLayout({ headline, subhead, children }) {
  return (
    <div className="ncc-ambient-glow grid min-h-screen bg-bg text-fg min-[860px]:grid-cols-[minmax(360px,480px)_1fr]">
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden border-r border-white/10 bg-[#083b5b] [background-image:var(--brand-grad)] px-9 py-11 text-white max-[859px]:border-r-0 max-[859px]:border-b max-[859px]:px-6 max-[859px]:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 28% 42%, rgba(255,255,255,0.09), transparent 58%), repeating-linear-gradient(-18deg, transparent 0 10px, rgba(255,255,255,0.035) 10px 11px)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 text-white no-underline">
            <Image
              src="/brand/ncc-logo.png"
              alt="NCC_DSA logo"
              width={40}
              height={40}
              priority
              className="size-10 flex-none rounded-[6px] object-cover ring-1 ring-white/20"
            />
            <span className="font-mono leading-[1.15] font-bold tracking-tight">
              NCC_DSA
              <span className="mt-0.5 block font-mono text-[10px] font-medium tracking-[0.1em] text-[#9bb6c8] uppercase">
                Night Code Club
              </span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="m-0 text-3xl leading-[1.15] font-bold tracking-tight text-balance text-white">
            {headline}
          </h1>
          <p className="m-0 max-w-[38ch] text-sm leading-relaxed text-[#c6d6e6]">{subhead}</p>

          <div className="mt-1 flex items-center gap-2" aria-hidden="true">
            {[
              { letter: "A", cls: "border-[#34d399]/50 bg-[#022c22]/80 text-[#34d399]" },
              { letter: "B", cls: "border-[#34d399]/50 bg-[#022c22]/80 text-[#34d399]" },
              { letter: "C", cls: "border-[#4eb8ef]/50 bg-[#0a2740]/80 text-[#7ccaf5]" },
              { letter: "D", cls: "border-[#fb7185]/45 bg-[#4c0519]/75 text-[#fb7185]" },
              { letter: "E", cls: "border-white/20 bg-white/5 text-white/75" },
            ].map((item) => (
              <span
                key={item.letter}
                className={`grid size-7 place-items-center rounded-[2px] border font-mono text-xs font-bold ${item.cls}`}
              >
                {item.letter}
              </span>
            ))}
          </div>
        </div>

        <dl className="relative z-10 m-0 border-t border-white/15 pt-4 font-mono text-[13px] max-[480px]:hidden">
          <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5">
            <dt className="text-[11px] font-semibold tracking-wider text-[#9bb6c8] uppercase">Tracks</dt>
            <dd className="m-0 font-bold text-[#7ccaf5]">Individual &amp; Group</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5">
            <dt className="text-[11px] font-semibold tracking-wider text-[#9bb6c8] uppercase">Rating Scale</dt>
            <dd className="m-0 font-bold text-[#7ccaf5] tabular-nums">1.00 – 5.00</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[11px] font-semibold tracking-wider text-[#9bb6c8] uppercase">Standings</dt>
            <dd className="m-0 font-bold text-[#7ccaf5]">Codeforces</dd>
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
