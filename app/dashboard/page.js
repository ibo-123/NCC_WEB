"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Flame, Lightbulb, Radio, Star, Trophy, Users } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { DashboardSkeleton } from "@/components/ui/Skeleton.js";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart.js";
import { TopicDonutChart } from "@/components/charts/TopicDonutChart.js";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, formatShortDate, statusToTone } from "@/lib/status.js";

const TOPIC_COLORS = ["#9ef02a", "#6fb81b", "#4c8c0a", "#325c0b", "#64748b"];

export default function StudentDashboardPage() {
  const { store, hydrated, currentUser, currentTeam } = usePlatform();

  const openSession = store.attendanceSessions.find((s) => !s.closedAt);
  const publishedAnnouncements = store.announcements.filter((a) => a.status === "published").slice(0, 3);
  const publishedLectures = store.lectures.filter((l) => l.status === "published").slice(0, 3);
  const publishedProblems = store.problems.filter((p) => p.status === "published");
  const solvedCount = currentUser
    ? publishedProblems.filter((p) => store.verifications[`${currentUser.id}:${p.id}`]?.status === "solved").length
    : 0;
  const userHistory = currentUser ? (store.ratingHistory[currentUser.id] ?? []) : [];
  const latestRatingEntry = userHistory[0];
  const activeContests = store.contests
    .filter((c) => c.publication === "published" && c.status !== "completed")
    .slice(0, 4);

  const ratingBars = [...userHistory]
    .reverse()
    .map((pt) => ({
      label: pt.label,
      value: Number(pt.value.toFixed(2)),
      detail: pt.change !== null && pt.change !== undefined ? `${pt.change >= 0 ? "+" : ""}${pt.change.toFixed(2)}` : "initial",
    }));

  const topicSegments = store.topics.map((topic, idx) => {
    const probs = publishedProblems.filter((p) => p.topicId === topic.id);
    const solved = currentUser
      ? probs.filter((p) => store.verifications[`${currentUser.id}:${p.id}`]?.status === "solved").length
      : 0;
    return {
      label: topic.name,
      value: solved,
      color: TOPIC_COLORS[idx % TOPIC_COLORS.length],
    };
  });

  const totalSteps = Math.max(1, publishedProblems.length);

  return (
    <PlatformShell mode="student" breadcrumbs={[{ label: "Overview" }]}>
      {!hydrated ? (
        <DashboardSkeleton />
      ) : (
        <>
          <PageHeader
            title={`Overview · ${currentUser?.name?.split(" ")[0] ?? "Student"}`}
            description="Individual practice progress, rating snapshots, live lecture sessions, and Group competition."
            actions={
              openSession ? (
                <ButtonLink href={`/lectures/${openSession.lectureId}`}>
                  <Radio aria-hidden="true" size={16} />
                  Join live attendance
                </ButtonLink>
              ) : (
                <ButtonLink href="/progress" variant="outline">
                  Continue practice
                </ButtonLink>
              )
            }
          />

          {/* Top 4 KPI Bento Row */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={Star}
              label="Official Rating"
              value={
                currentUser?.rating !== null && currentUser?.rating !== undefined
                  ? currentUser.rating.toFixed(2)
                  : "—"
              }
              hint={
                latestRatingEntry?.change !== null && latestRatingEntry?.change !== undefined
                  ? `${latestRatingEntry.change >= 0 ? "+" : ""}${latestRatingEntry.change.toFixed(2)}`
                  : "Scale 1–5"
              }
              trend={
                latestRatingEntry?.change > 0
                  ? "up"
                  : latestRatingEntry?.change < 0
                    ? "down"
                    : undefined
              }
              href="/rating"
            />
            <Stat
              icon={Flame}
              label="Individual Streak"
              value="14 days"
              hint="Best 21d"
              trend="up"
              href="/streak"
            />
            <Stat
              icon={Trophy}
              label="Problems Solved"
              value={`${solvedCount} / ${publishedProblems.length}`}
              hint={`${Math.round((solvedCount / totalSteps) * 100)}%`}
              trend="up"
              href="/progress"
            />
            <Stat
              icon={CalendarCheck}
              label="Attendance"
              value={currentUser?.attendedCount ?? 0}
              hint={openSession ? "1 live window" : `${store.attendanceSessions.length} sessions`}
              href="/attendance"
            />
          </section>

          {/* Middle Bento Analytics Row: Ledger | Bar Chart | Donut Breakdown */}
          <section className="grid gap-4 lg:grid-cols-[1fr_1.45fr_1fr]">
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Activity ledger</h2>
                <Link href="/attendance" className="text-xs font-semibold text-primary">
                  History
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {store.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-sunken px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-muted">{item.title}</div>
                      <div className="truncate text-sm font-semibold text-fg">{item.detail}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-primary tabular-nums">{item.date}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Rating Trajectory
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums">
                      {currentUser?.rating !== null && currentUser?.rating !== undefined
                        ? currentUser.rating.toFixed(2)
                        : "—"}
                    </span>
                    <span className="text-xs text-muted">/ 5.00 scale</span>
                  </div>
                </div>
                <ButtonLink href="/rating" size="sm" variant="outline">
                  Full breakdown
                </ButtonLink>
              </div>

              {ratingBars.length > 0 ? (
                <WeeklyBarChart items={ratingBars} maxValue={5} />
              ) : (
                <p className="m-0 text-sm text-muted">No rating snapshots recorded yet.</p>
              )}
            </Card>

            <Card className="flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Topic Breakdown</h2>
                <Badge tone="neutral">{store.topics.length} topics</Badge>
              </div>

              <TopicDonutChart
                segments={topicSegments}
                centerValue={`${solvedCount}/${publishedProblems.length}`}
                centerLabel="Solved"
              />

              <div className="rounded-xl border border-border bg-sunken px-3.5 py-2.5 text-xs text-fg-2">
                {currentTeam ? (
                  <span>
                    Team <strong className="text-fg">{currentTeam.name}</strong> ·{" "}
                    <strong className="text-fg">{currentTeam.streak?.current ?? 0}d</strong> group streak
                  </span>
                ) : (
                  <span>No active team joined yet — join or create one on My team.</span>
                )}
              </div>
            </Card>
          </section>

          {/* Bottom Spotlight Row: Electric Lime Insight Card + Heatmap */}
          <section className="grid gap-4 lg:grid-cols-[0.95fr_1.55fr]">
            <Card lime className="flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/90 px-3 py-1 text-xs font-semibold text-white">
                  <Lightbulb aria-hidden="true" size={13} />
                  Cohort Insight
                </span>
                <span className="font-mono text-xs font-semibold opacity-80">
                  {solvedCount}/{publishedProblems.length} solved
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <p className="m-0 text-xl leading-snug font-semibold tracking-tight">
                  {openSession
                    ? `Live attendance is open for ${openSession.lectureTitle} — submit your 4-digit code.`
                    : `Solved ${solvedCount} of ${publishedProblems.length} curated problems across ${store.topics.length} DSA topics.`}
                </p>

                <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
                  {Array.from({ length: Math.min(10, totalSteps) }).map((_, i) => {
                    const filledCount = Math.round((solvedCount / totalSteps) * Math.min(10, totalSteps));
                    return (
                      <span
                        key={i}
                        className={`h-2.5 flex-1 rounded-sm ${i < filledCount ? "bg-black/90" : "bg-black/20"}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Link
                  href={openSession ? `/lectures/${openSession.lectureId}` : "/progress"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black/90 px-3.5 py-2 text-xs font-semibold text-white no-underline hover:bg-black"
                >
                  {openSession ? "Enter attendance code" : "Open practice topics"}
                  <ArrowRight aria-hidden="true" size={13} />
                </Link>
                {currentTeam ? (
                  <Link href="/teams" className="inline-flex items-center gap-1 text-xs font-semibold text-black/80 hover:text-black">
                    <Users aria-hidden="true" size={13} />
                    {currentTeam.name}
                  </Link>
                ) : null}
              </div>
            </Card>

            <Card className="flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Qualifying Activity (18 Weeks)</h2>
                <Link href="/streak" className="text-xs font-semibold text-primary">
                  Team &amp; Individual streaks
                </Link>
              </div>
              <ActivityHeatmap cells={store.heatmapIndividual} />
            </Card>
          </section>

          {/* Schedule & Notices Row */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Lectures</h2>
                <Link href="/lectures" className="text-xs font-semibold text-primary">
                  All lectures
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {publishedLectures.map((lec) => {
                  const hasOpen = store.attendanceSessions.some((s) => s.lectureId === lec.id && !s.closedAt);
                  return (
                    <Link
                      key={lec.id}
                      href={`/lectures/${lec.id}`}
                      className="flex items-center justify-between gap-3 py-3 text-inherit no-underline first:pt-1 last:pb-1 hover:opacity-85"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-fg">{lec.title}</div>
                        <div className="mt-0.5 text-xs text-muted">{formatDateTime(lec.scheduledAt)}</div>
                      </div>
                      <Badge tone={hasOpen ? "danger" : statusToTone(lec.state)} dot={hasOpen}>
                        {hasOpen ? "Open" : lec.state}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Contests</h2>
                <Link href="/contests" className="text-xs font-semibold text-primary">
                  All contests
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {activeContests.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contests/${c.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-inherit no-underline first:pt-1 last:pb-1 hover:opacity-85"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-fg">{c.title}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        {formatDateTime(c.startsAt)} · {c.mode === "team" ? "Group" : "Individual"}
                      </div>
                    </div>
                    <Badge tone={statusToTone(c.status)}>{c.status}</Badge>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Announcements</h2>
                <Link href="/announcements" className="text-xs font-semibold text-primary">
                  View all
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {publishedAnnouncements.map((ann) => (
                  <Link
                    key={ann.id}
                    href={`/announcements/${ann.id}`}
                    className={`block rounded-xl border p-3 text-inherit no-underline transition-colors hover:bg-sunken ${
                      ann.type === "important" ? "border-warning/45 bg-warning-soft/20" : "border-border bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-fg">{ann.title}</span>
                      <Badge tone={statusToTone(ann.type)}>{ann.type}</Badge>
                    </div>
                    <span className="mt-1 block text-[11px] text-muted">{formatShortDate(ann.publishedAt)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </PlatformShell>
  );
}
