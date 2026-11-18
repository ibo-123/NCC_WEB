"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { ProgressBar } from "@/components/ui/ProgressBar.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { TopicDonutChart } from "@/components/charts/TopicDonutChart.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

const TOPIC_COLORS = ["#9ef02a", "#6fb81b", "#4c8c0a", "#325c0b", "#64748b"];

export default function StudentProgressPage() {
  const { store, currentUser } = usePlatform();

  const publishedProblems = store.problems.filter((p) => p.status === "published");
  const topicRows = [...store.topics]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((topic, idx) => {
      const probs = publishedProblems.filter((p) => p.topicId === topic.id);
      const solved = currentUser
        ? probs.filter((p) => store.verifications[`${currentUser.id}:${p.id}`]?.status === "solved").length
        : 0;
      const pct = probs.length > 0 ? Math.round((solved / probs.length) * 100) : 0;
      return { ...topic, total: probs.length, solved, pct, color: TOPIC_COLORS[idx % TOPIC_COLORS.length] };
    });

  const totalSolved = topicRows.reduce((acc, r) => acc + r.solved, 0);
  const totalProblems = topicRows.reduce((acc, r) => acc + r.total, 0);
  const overallPct = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const completedTopics = topicRows.filter((r) => r.total > 0 && r.solved === r.total).length;

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Progress" }]}
    >
      <PageHeader
        title="Practice Progress"
        description="Track your provisional solve status across curated DSA topics."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Solved Problems"
          value={`${totalSolved} / ${totalProblems}`}
          hint={`${overallPct}% of published problem set`}
          trend="up"
        />
        <Stat label="Topics Tracked" value={topicRows.length} hint={`${completedTopics} completed`} />
        <Stat
          label="Codeforces Handle"
          value={currentUser?.handles?.codeforces ?? "Unlinked"}
          hint={
            currentUser?.handles?.codeforces
              ? "Used for provisional solve checks"
              : "Link a handle on your profile"
          }
          href="/profile"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-base font-semibold">Overall completion</h2>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {totalSolved} / {totalProblems}
            </span>
          </div>
          <ProgressBar value={overallPct} label="Overall practice completion" />
          <p className="m-0 text-xs text-fg-2">
            Open any topic below to view individual problems and run Codeforces provisional solve checks.
          </p>
        </Card>

        <Card>
          <TopicDonutChart
            segments={topicRows.map((t) => ({ label: t.name, value: t.solved, color: t.color }))}
            centerValue={`${totalSolved}/${totalProblems}`}
            centerLabel="Solved"
          />
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {topicRows.map((topic) => (
          <Card key={topic.id} className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-lg font-semibold tracking-tight">
                  <Link href={`/progress/${topic.id}`} className="text-fg no-underline hover:text-primary">
                    {topic.name}
                  </Link>
                </h2>
                <span className="font-mono text-sm font-semibold text-fg tabular-nums">
                  {topic.solved} / {topic.total}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={topic.pct} label={`${topic.name} completion`} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>{topic.total - topic.solved} remaining</span>
              <ButtonLink href={`/progress/${topic.id}`} size="sm" variant="outline">
                Open topic
                <ArrowRight aria-hidden="true" size={14} />
              </ButtonLink>
            </div>
          </Card>
        ))}
      </section>
    </PlatformShell>
  );
}
