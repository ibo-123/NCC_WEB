"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { StarRating } from "@/components/ui/StarRating.js";
import { Callout } from "@/components/ui/Callout.js";
import { ProgressBar } from "@/components/ui/ProgressBar.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { RatingChart } from "@/components/charts/RatingChart.js";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

export default function StudentRatingPage() {
  const { store, currentUser } = usePlatform();
  const [chartType, setChartType] = useState("line");

  const history = currentUser ? (store.ratingHistory[currentUser.id] ?? []) : [];
  const latest = history[0] ?? null;
  const ratingVal = currentUser?.rating ?? latest?.value ?? null;
  const chartPoints = [...history].reverse();

  const components = latest?.components ?? { problem: 4.5, contest: 4.1, attendance: 4.7 };
  const isNearThreshold = ratingVal !== null && ratingVal < 2.2;

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Rating" }]}
    >
      <PageHeader
        title="Rating & Standing"
        description="Stored cohort rating (1.00–5.00), component snapshot, and historical trend."
        actions={
          <ButtonLink href="/rating/history" variant="outline" size="sm">
            Full snapshot table
            <ArrowRight aria-hidden="true" size={14} />
          </ButtonLink>
        }
      />

      {isNearThreshold ? (
        <Callout tone="warn" title="Below target rating threshold">
          Ratings below 2.00 are flagged for cohort review. Keep completing weekly problems, contests, and lecture check-ins.
        </Callout>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="flex flex-col justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
              Current Official Rating
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">
                {ratingVal !== null ? ratingVal.toFixed(2) : "—"}
              </span>
              {ratingVal !== null ? <StarRating value={ratingVal} /> : null}
            </div>
            {latest?.change !== null && latest?.change !== undefined ? (
              <p className={`mt-1.5 mb-0 font-mono text-sm font-semibold tabular-nums ${latest.change >= 0 ? "text-up" : "text-down"}`}>
                {latest.change >= 0 ? "+" : ""}
                {latest.change.toFixed(2)} from previous snapshot ({latest.previous?.toFixed(2)})
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <h2 className="m-0 text-sm font-semibold">Component breakdown</h2>
            {[
              { label: "Problem solving", val: components.problem },
              { label: "Contest performance", val: components.contest },
              { label: "Attendance", val: components.attendance },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-fg-2">{item.label}</span>
                  <span className="font-mono font-semibold text-fg tabular-nums">{item.val.toFixed(2)} / 5.00</span>
                </div>
                <ProgressBar value={(item.val / 5) * 100} label={item.label} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-base font-semibold">Rating trajectory</h2>
            <div className="flex items-center gap-2">
              <Tabs
                items={[
                  { id: "line", label: "Line" },
                  { id: "bars", label: "Bars" },
                ]}
                activeId={chartType}
                onChange={setChartType}
                ariaLabel="Chart view"
              />
              <Link href="/rating/history" className="text-xs font-semibold text-primary">
                Table
              </Link>
            </div>
          </div>
          {chartPoints.length > 0 ? (
            chartType === "line" ? (
              <RatingChart points={chartPoints} />
            ) : (
              <WeeklyBarChart
                items={chartPoints.map((pt) => ({
                  label: pt.label,
                  value: Number(pt.value.toFixed(2)),
                  detail: pt.change !== null && pt.change !== undefined ? `${pt.change >= 0 ? "+" : ""}${pt.change.toFixed(2)}` : undefined,
                }))}
                maxValue={5}
              />
            )
          ) : (
            <p className="m-0 text-sm text-muted">No rating snapshots recorded yet.</p>
          )}
        </Card>
      </section>
    </PlatformShell>
  );
}
