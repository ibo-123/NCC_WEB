"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Trophy } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

const MODE_TABS = [
  { id: "individual", label: "Individual" },
  { id: "team", label: "Group" },
];

export function ContestsView({ initialMode = "individual" }) {
  const { store } = usePlatform();
  const [mode, setMode] = useState(initialMode);

  const contests = useMemo(
    () => store.contests.filter((c) => c.publication === "published" && c.mode === mode),
    [store.contests, mode],
  );

  const groups = [
    { key: "active", label: "Active now", items: contests.filter((c) => c.status === "active") },
    { key: "upcoming", label: "Upcoming", items: contests.filter((c) => c.status === "upcoming") },
    { key: "completed", label: "Completed", items: contests.filter((c) => c.status === "completed") },
  ].filter((g) => g.items.length > 0);

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: mode === "team" ? "Team contests" : "Contests" },
      ]}
    >
      <PageHeader
        title={mode === "team" ? "Team Contests" : "Contests"}
        description={
          mode === "team"
            ? "Week-long Group Codeforces rounds with derived team standings."
            : "Scheduled individual Codeforces rounds and published standings."
        }
        actions={
          <Tabs
            items={MODE_TABS}
            activeId={mode}
            onChange={setMode}
            ariaLabel="Contest mode"
          />
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={`No ${mode === "team" ? "team" : "individual"} contests yet`}
          description="Published contests for this track will appear here once scheduled by an administrator."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="m-0 text-sm font-semibold tracking-wider text-muted uppercase">
                {group.label}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((contest) => (
                  <Card key={contest.id} className="flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone={statusToTone(contest.status)} dot={contest.status === "active"}>
                          {contest.status}
                        </Badge>
                        <span className="text-xs text-muted tabular-nums">
                          {contest.durationMinutes >= 1440
                            ? `${Math.round(contest.durationMinutes / 1440)} days`
                            : `${contest.durationMinutes} min`}
                        </span>
                      </div>
                      <h3 className="mt-2.5 mb-0 text-lg font-semibold tracking-tight">
                        <Link href={`/contests/${contest.id}`} className="text-fg no-underline hover:text-primary">
                          {contest.title}
                        </Link>
                      </h3>
                      <p className="mt-1.5 mb-0 text-sm text-fg-2">{contest.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="text-xs text-muted tabular-nums">
                        Starts {formatDateTime(contest.startsAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {contest.resultsState === "published" ? (
                          <ButtonLink href={`/results/${contest.id}`} size="sm">
                            View results
                          </ButtonLink>
                        ) : contest.invitationUrl ? (
                          <a
                            href={contest.invitationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-strong px-2.5 text-[13px] font-semibold text-fg no-underline hover:bg-sunken"
                          >
                            Codeforces
                            <ExternalLink aria-hidden="true" size={13} />
                          </a>
                        ) : null}
                        <ButtonLink href={`/contests/${contest.id}`} size="sm" variant="outline">
                          Details
                        </ButtonLink>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
