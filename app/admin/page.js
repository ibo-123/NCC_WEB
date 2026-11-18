"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Lightbulb, Lock, ShieldCheck, Users } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { DashboardSkeleton } from "@/components/ui/Skeleton.js";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart.js";
import { TopicDonutChart } from "@/components/charts/TopicDonutChart.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

export default function AdminDashboardPage() {
  const { store, hydrated } = usePlatform();

  const totalUsers = store.users.length;
  const activeStudents = store.users.filter((u) => u.role === "student" && u.status === "active").length;
  const restrictedUsers = store.users.filter((u) => u.status === "restricted").length;
  const adminCount = store.users.filter((u) => u.role === "admin").length;
  const activeTeams = store.teams.filter((t) => t.status === "active").length;
  const publishedLectures = store.lectures.filter((l) => l.status === "published").length;
  const openSessions = store.attendanceSessions.filter((s) => !s.closedAt).length;
  const publishedContests = store.contests.filter((c) => c.publication === "published").length;
  const publishedProblems = store.problems.filter((p) => p.status === "published").length;

  const topicProblemBars = store.topics.map((t) => ({
    label: t.name.split(" ")[0],
    value: store.problems.filter((p) => p.topicId === t.id).length,
    detail: t.name,
  }));

  const accountSegments = [
    { label: "Active Students", value: activeStudents, color: "#4eb8ef" },
    { label: "Restricted", value: restrictedUsers, color: "#fb7185" },
    { label: "Admins", value: adminCount, color: "#7aa0e8" },
    { label: "Active Teams", value: activeTeams, color: "#34d399" },
  ];

  return (
    <PlatformShell mode="admin" breadcrumbs={[{ label: "Admin Console" }]}>
      {!hydrated ? (
        <DashboardSkeleton />
      ) : (
        <>
          <PageHeader
            title="Admin Overview"
            description="Cohort standing, content publication status, live attendance windows, and audit governance."
            actions={
              <>
                <ButtonLink href="/admin/attendance" size="sm">
                  Manage attendance
                </ButtonLink>
                <ButtonLink href="/admin/results" size="sm" variant="outline">
                  Fetch results
                </ButtonLink>
              </>
            }
          />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={Users}
              label="Total Users"
              value={totalUsers}
              hint={`${activeStudents} active`}
              trend="up"
              href="/admin/users"
            />
            <Stat
              icon={Lock}
              label="Restricted Accounts"
              value={restrictedUsers}
              hint={restrictedUsers > 0 ? "Needs review" : "All active"}
              trend={restrictedUsers > 0 ? "down" : undefined}
              href="/admin/restricted"
            />
            <Stat
              icon={Users}
              label="Active Teams"
              value={activeTeams}
              hint="Max 5 each"
              href="/admin/teams"
            />
            <Stat
              icon={CalendarCheck}
              label="Open Attendance"
              value={openSessions}
              hint={openSessions > 0 ? "Code live" : "None open"}
              trend={openSessions > 0 ? "up" : undefined}
              href="/admin/attendance"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1.45fr_1fr]">
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Content Ledger</h2>
                <Link href="/admin/lectures" className="text-xs font-semibold text-primary">
                  Manage
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Published Lectures", val: publishedLectures, sub: `${store.lectures.length} total`, href: "/admin/lectures" },
                  { label: "Published Contests", val: publishedContests, sub: "Individual & Group", href: "/admin/contests" },
                  { label: "Published Problems", val: publishedProblems, sub: `${store.topics.length} topics`, href: "/admin/problems" },
                  { label: "Audit Events", val: store.auditLogs.length, sub: "Correlation tracked", href: "/admin/audit-log" },
                ].map((row) => (
                  <Link
                    key={row.label}
                    href={row.href}
                    className="flex items-center justify-between gap-3 rounded-[3px] border border-border bg-sunken px-3.5 py-2.5 text-inherit no-underline transition-colors hover:border-primary/40"
                  >
                    <div>
                      <div className="text-xs font-medium text-muted">{row.label}</div>
                      <div className="text-[11px] text-fg-2">{row.sub}</div>
                    </div>
                    <strong className="font-mono text-lg font-semibold text-fg tabular-nums">{row.val}</strong>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Problems by Topic
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums">{store.problems.length}</span>
                    <span className="text-xs text-muted">across {store.topics.length} topics</span>
                  </div>
                </div>
                <ButtonLink href="/admin/problems" size="sm" variant="outline">
                  Manage problems
                </ButtonLink>
              </div>

              <WeeklyBarChart items={topicProblemBars} />
            </Card>

            <Card className="flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Cohort Breakdown</h2>
                <Badge tone="neutral">{totalUsers} users</Badge>
              </div>

              <TopicDonutChart
                segments={accountSegments}
                centerValue={activeStudents}
                centerLabel="Active"
              />

              <div className="flex items-center justify-between rounded-[3px] border border-border bg-sunken px-3.5 py-2.5 text-xs text-fg-2">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck aria-hidden="true" size={14} className="text-primary" />
                  Admin 2FA
                </span>
                <Link href="/admin/security/2fa" className="font-semibold text-primary">
                  {store.admin2faEnabled ? "Enabled" : "Configure"}
                </Link>
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.95fr_1.55fr]">
            <Card lime className="flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/25 bg-black/25 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-white uppercase">
                  <Lightbulb aria-hidden="true" size={13} />
                  Action Focus
                </span>
                <span className="font-mono text-xs font-semibold text-white/85 tabular-nums">
                  {restrictedUsers} restricted
                </span>
              </div>

              <p className="m-0 text-xl leading-snug font-semibold tracking-tight text-white">
                {restrictedUsers > 0
                  ? `${restrictedUsers} student account awaiting standing review and reopen confirmation.`
                  : `${openSessions} live attendance window active across ${publishedLectures} published lectures.`}
              </p>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href={restrictedUsers > 0 ? "/admin/restricted" : "/admin/attendance"}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-white px-3.5 py-2 font-mono text-xs font-semibold text-[#083b5b] no-underline transition-colors hover:bg-white/90"
                >
                  {restrictedUsers > 0 ? "Review restricted" : "Open attendance"}
                  <ArrowRight aria-hidden="true" size={13} />
                </Link>
                <Link href="/admin/results" className="font-mono text-xs font-semibold text-white/90 no-underline hover:text-white">
                  Contest pipeline
                </Link>
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Recent Administrative Activity</h2>
                <Link href="/admin/audit-log" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Full audit log
                  <ArrowRight aria-hidden="true" size={13} />
                </Link>
              </div>

              <ol className="m-0 flex list-none flex-col divide-y divide-border p-0">
                {store.auditLogs.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{entry.entityType}</Badge>
                        <span className="text-sm font-semibold text-fg">{entry.summary}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {entry.actor?.name ?? "System"} · <code className="font-mono">{entry.action}</code>
                      </div>
                    </div>
                    <span className="text-xs text-muted tabular-nums">{formatDateTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </section>
        </>
      )}
    </PlatformShell>
  );
}
