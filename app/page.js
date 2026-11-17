<<<<<<< HEAD
"use client";

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

  function enterAs(userId, dest) {
    switchRoleQuick(userId);
    router.push(dest);
  }

  return (
    <div className="ncc-ambient-glow min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-topbar/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight whitespace-nowrap text-fg no-underline">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-text">
              N
            </span>
            <span>NCC_DSA</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-fg-2 md:flex" aria-label="Primary">
            <Link href="/dashboard" className="whitespace-nowrap shrink-0 text-fg-2 no-underline transition-colors hover:text-fg">
              Student Portal
            </Link>
            <Link href="/admin" className="whitespace-nowrap shrink-0 text-fg-2 no-underline transition-colors hover:text-fg">
              Admin Console
            </Link>
            <Link href="/contests" className="whitespace-nowrap shrink-0 text-fg-2 no-underline transition-colors hover:text-fg">
              Contests
            </Link>
            <Link href="/login" className="whitespace-nowrap shrink-0 text-fg-2 no-underline transition-colors hover:text-fg">
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

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-between gap-6 py-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <span>Individual Practice</span>
                <span aria-hidden="true">·</span>
                <span>Group Competition</span>
                <span aria-hidden="true">·</span>
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

          <Card className="flex flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Workspace Preview
                </p>
                <h2 className="m-0 mt-1 text-lg font-semibold">Switch account state</h2>
              </div>
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-text">
                <ArrowUpRight aria-hidden="true" size={16} />
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => enterAs("u-ibrahim", "/dashboard")}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-sunken px-3.5 py-3 text-left text-fg transition-colors hover:border-primary/40 hover:bg-highlight"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Ibrahim Kedir</div>
                  <div className="truncate text-xs text-muted">Active student · Binary Hawks captain · 4.27 rating</div>
                </div>
                <Badge tone="success">Student</Badge>
              </button>

              <button
                type="button"
                onClick={() => enterAs("u-marta", "/admin")}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-sunken px-3.5 py-3 text-left text-fg transition-colors hover:border-primary/40 hover:bg-highlight"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Marta Alemu</div>
                  <div className="truncate text-xs text-muted">Administrator · Lectures, attendance, contests &amp; results</div>
                </div>
                <Badge tone="info">Admin</Badge>
              </button>

              <button
                type="button"
                onClick={() => enterAs("u-liya", "/restricted")}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-sunken px-3.5 py-3 text-left text-fg transition-colors hover:border-error/40"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Liya Mekonnen</div>
                  <div className="truncate text-xs text-muted">Restricted student · Rating 1.84 · Standing view</div>
                </div>
                <Badge tone="danger">Restricted</Badge>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
              <div>
                <div className="text-muted">Topics</div>
                <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{store.topics.length}</div>
              </div>
              <div>
                <div className="text-muted">Problems</div>
                <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{store.problems.length}</div>
              </div>
              <div>
                <div className="text-muted">Contests</div>
                <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{store.contests.length}</div>
              </div>
            </div>
          </Card>
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-semibold">
                <Lock aria-hidden="true" size={12} />
                Standing Policy
              </span>
            </div>
            <p className="m-0 text-sm leading-snug font-semibold">
              Restricted accounts are isolated to a standing review page until reopened by an administrator.
            </p>
            <button
              type="button"
              onClick={() => enterAs("u-liya", "/restricted")}
              className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-black/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
            >
              Preview restricted state
              <ArrowRight aria-hidden="true" size={13} />
            </button>
          </Card>
        </section>
      </main>
    </div>
=======
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="m-0 text-[28px] font-semibold tracking-tight">NCC DSA</h1>
      <p className="m-0 text-fg-2">The platform is being built. Sign-in and the student dashboard arrive with the auth and learning work.</p>
    </main>
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
  );
}
