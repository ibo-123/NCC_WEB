"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, BarChart3, CalendarCheck, Lock, ShieldCheck, Trophy, Users } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { ThemeToggle } from "@/components/layout/ThemeToggle.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

export default function HomePage() {
  const router = useRouter();
  const { store, switchRoleQuick } = usePlatform();

  async function enterAs(userId, dest) {
    const res = await switchRoleQuick(userId);
    if (!res?.ok) {
      router.push("/login");
      return;
    }
    if (res.requiresTwoFactor) {
      router.push("/login");
      return;
    }
    router.push(dest);
  }

  return (
    <div className="ncc-ambient-glow flex min-h-screen flex-col bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-topbar/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-fg no-underline whitespace-nowrap">
            <Image
              src="/brand/ncc-logo.png"
              alt="NCC_DSA logo"
              width={36}
              height={36}
              className="size-9 rounded-[4px] object-cover ring-1 ring-white/15"
              priority
            />
            <div className="leading-tight">
              <span className="block bg-gradient-to-r from-[#083b5b] via-[#303664] to-[#5d1c4d] bg-clip-text font-mono text-[22px] leading-none font-extrabold tracking-tight text-transparent dark:from-[#4eb8ef] dark:via-[#7aa0e8] dark:to-[#e87ab8]">
                NCC
              </span>
              <span className="mt-0.5 block text-xs font-medium text-muted">
                Nur Coders Community
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-fg-2 md:flex" aria-label="Primary">
            <Link href="/dashboard" className="shrink-0 whitespace-nowrap text-fg-2 no-underline transition-colors hover:text-fg">
              Student Portal
            </Link>
            <Link href="/admin" className="shrink-0 whitespace-nowrap text-fg-2 no-underline transition-colors hover:text-fg">
              Admin Console
            </Link>
            <Link href="/contests" className="shrink-0 whitespace-nowrap text-fg-2 no-underline transition-colors hover:text-fg">
              Contests
            </Link>
            <Link href="/login" className="shrink-0 whitespace-nowrap text-fg-2 no-underline transition-colors hover:text-fg">
              Sign in
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <ThemeToggle />
            <ButtonLink href="/register" size="sm">
              Create account
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
        <section className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-between gap-6 py-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-semibold tracking-wider text-primary uppercase">
                <span>Individual Practice</span>
                <span aria-hidden="true" className="text-muted">·</span>
                <span>Group Competition</span>
                <span aria-hidden="true" className="text-muted">·</span>
                <span>Shared Learning</span>
              </div>
              <h1 className="m-0 max-w-[18ch] text-[clamp(2.2rem,3.8vw,3.35rem)] leading-[1.08] font-semibold tracking-tight text-balance">
                Structured DSA training and Codeforces standings.
              </h1>
              <p className="m-0 max-w-[54ch] text-base leading-relaxed text-fg-2">
                Practice curated problems by topic, submit live 4-digit lecture attendance codes, compete individually or in 5-member teams, and track your 1.00–5.00 term rating.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => enterAs("u-ibrahim", "/dashboard")} size="lg">
                Open Student Portal
                <ArrowRight aria-hidden="true" size={16} />
              </Button>
              <Button onClick={() => enterAs("u-marta", "/admin")} variant="outline" size="lg">
                Open Admin Console
              </Button>
              <ButtonLink href="/login" variant="ghost" size="lg">
                Sign in with email
              </ButtonLink>
            </div>
          </div>

          <Card className="flex flex-col justify-between gap-5 border-t-2 border-t-primary">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3.5">
                <Image
                  src="/brand/ncc-logo.png"
                  alt="Night Code Club official crest"
                  width={56}
                  height={56}
                  className="size-14 rounded-[4px] object-cover ring-1 ring-white/15"
                  priority
                />
                <div>
                  <p className="m-0 font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Workspace Preview
                  </p>
                  <h2 className="m-0 mt-0.5 text-lg font-semibold">Switch account state</h2>
                </div>
              </div>
              <span className="grid size-8 flex-none place-items-center rounded-[3px] bg-primary text-primary-text">
                <ArrowUpRight aria-hidden="true" size={16} />
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => enterAs("u-ibrahim", "/dashboard")}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[3px] border border-border bg-sunken px-3.5 py-3 text-left text-fg transition-colors hover:border-primary/50 hover:bg-highlight"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Ibrahim Kedir</div>
                  <div className="truncate font-mono text-xs text-muted">Active student · Binary Hawks · 4.27</div>
                </div>
                <Badge tone="success">Student</Badge>
              </button>

              <button
                type="button"
                onClick={() => enterAs("u-marta", "/admin")}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[3px] border border-border bg-sunken px-3.5 py-3 text-left text-fg transition-colors hover:border-primary/50 hover:bg-highlight"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Marta Alemu</div>
                  <div className="truncate font-mono text-xs text-muted">Administrator · Lectures &amp; standings</div>
                </div>
                <Badge tone="info">Admin</Badge>
              </button>

              <button
                type="button"
                onClick={() => enterAs("u-liya", "/restricted")}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[3px] border border-border bg-sunken px-3.5 py-3 text-left text-fg transition-colors hover:border-error/45"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Liya Mekonnen</div>
                  <div className="truncate font-mono text-xs text-muted">Restricted student · Rating 1.84</div>
                </div>
                <Badge tone="danger">Restricted</Badge>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
              <div>
                <div className="font-mono text-[11px] text-muted uppercase">Topics</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[var(--rank)] tabular-nums">{store.topics.length}</div>
              </div>
              <div>
                <div className="font-mono text-[11px] text-muted uppercase">Problems</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[var(--rank)] tabular-nums">{store.problems.length}</div>
              </div>
              <div>
                <div className="font-mono text-[11px] text-muted uppercase">Contests</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[var(--rank)] tabular-nums">{store.contests.length}</div>
              </div>
            </div>
          </Card>
        </section>

        {/* Contest-board telemetry strip matching official reference */}
        <section
          aria-label="Platform highlights"
          className="grid overflow-hidden rounded-[3px] border border-border bg-card sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="border-b border-border px-4 py-3.5 sm:border-r lg:border-b-0">
            <div className="font-mono text-[10px] font-bold tracking-[0.12em] text-muted uppercase">Tracks</div>
            <div className="mt-1 font-mono text-sm font-bold text-fg tabular-nums">Individual &amp; Group</div>
          </div>
          <div className="border-b border-border px-4 py-3.5 lg:border-r lg:border-b-0">
            <div className="font-mono text-[10px] font-bold tracking-[0.12em] text-muted uppercase">Rating Scale</div>
            <div className="mt-1 font-mono text-sm font-bold text-[var(--rank)] tabular-nums">1.00 – 5.00 Term</div>
          </div>
          <div className="border-b border-border px-4 py-3.5 sm:border-r sm:border-b-0">
            <div className="font-mono text-[10px] font-bold tracking-[0.12em] text-muted uppercase">Practice Catalog</div>
            <div className="mt-1 font-mono text-sm font-bold text-fg tabular-nums">
              {store.topics.length} Topics · {store.problems.length} Problems
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="font-mono text-[10px] font-bold tracking-[0.12em] text-muted uppercase">Judge Integration</div>
            <div className="mt-1 font-mono text-sm font-bold text-fg tabular-nums">Codeforces Standings</div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-semibold text-fg">Shared Learning &amp; Attendance</h2>
              <CalendarCheck aria-hidden="true" size={18} className="text-primary" />
            </div>
            <p className="mt-2.5 mb-0 text-sm leading-relaxed text-fg-2">
              Browse published announcements, access lecture slides and practice sheets, and submit 4-digit attendance codes while sessions are open.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-semibold text-fg">Individual Practice &amp; Rating</h2>
              <BarChart3 aria-hidden="true" size={18} className="text-primary" />
            </div>
            <p className="mt-2.5 mb-0 text-sm leading-relaxed text-fg-2">
              Track raw problem completion by topic, run provisional solve checks against Codeforces, and inspect your rating snapshots and streaks.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-semibold text-fg">Group Competition</h2>
              <Users aria-hidden="true" size={18} className="text-primary" />
            </div>
            <p className="mt-2.5 mb-0 text-sm leading-relaxed text-fg-2">
              Form teams of up to 5 students using 8-character invite codes, compete in week-long Codeforces rounds, and view derived team standings.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-semibold text-fg">Contest Results Pipeline</h2>
              <Trophy aria-hidden="true" size={18} className="text-primary" />
            </div>
            <p className="mt-2.5 mb-0 text-sm leading-relaxed text-fg-2">
              Admins fetch Codeforces standings, inspect matched handles and unmatched participants, and publish immutable final standings.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-semibold text-fg">Governance &amp; Audit</h2>
              <ShieldCheck aria-hidden="true" size={18} className="text-primary" />
            </div>
            <p className="mt-2.5 mb-0 text-sm leading-relaxed text-fg-2">
              Manage users, reopen restricted accounts, inspect audit logs with correlation IDs, and enroll admin two-factor authentication.
            </p>
          </Card>

          <Card lime className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/25 bg-black/25 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide text-white uppercase">
                <Lock aria-hidden="true" size={12} />
                Standing Policy
              </span>
            </div>
            <p className="m-0 text-sm leading-snug font-semibold text-white">
              Restricted accounts are isolated to a standing review page until reopened by an administrator.
            </p>
            <button
              type="button"
              onClick={() => enterAs("u-liya", "/restricted")}
              className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-[3px] border-0 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-[#083b5b] transition-colors hover:bg-white/90"
            >
              Preview restricted state
              <ArrowRight aria-hidden="true" size={13} />
            </button>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 text-xs text-muted">
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/ncc-mark.svg"
              alt=""
              width={20}
              height={20}
              className="size-5 opacity-80 dark:invert"
            />
            <span className="font-mono font-semibold text-fg-2">NCC_DSA · Night Code Club</span>
            <span aria-hidden="true">·</span>
            <span>Competitive Programming &amp; DSA Training</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <Link href="/contests" className="text-fg-2 no-underline hover:text-primary">
              Contests
            </Link>
            <Link href="/results" className="text-fg-2 no-underline hover:text-primary">
              Results
            </Link>
            <Link href="/login" className="text-fg-2 no-underline hover:text-primary">
              Sign in
            </Link>
            <Link href="/register" className="text-fg-2 no-underline hover:text-primary">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
