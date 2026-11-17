"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Radio, Video } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

const STATE_TABS = [
  { id: "all", label: "All" },
  { id: "Live", label: "Live" },
  { id: "Starting soon", label: "Starting soon" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "Completed", label: "Completed" },
];

export default function LecturesPage() {
  const { store } = usePlatform();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const lectures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.lectures.filter((lec) => {
      if (lec.status !== "published") return false;
      if (stateFilter !== "all" && lec.state !== stateFilter) return false;
      if (q && !lec.title.toLowerCase().includes(q) && !lec.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [store.lectures, query, stateFilter]);

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Lectures" }]}
    >
      <PageHeader
        title="Lectures"
        description="Scheduled sessions, live meeting links, slides, and practice sheets."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search lectures..."
          label="Search lectures"
        />
        <Tabs items={STATE_TABS} activeId={stateFilter} onChange={setStateFilter} ariaLabel="Filter lectures" />
      </div>

      {lectures.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No lectures match this filter"
          description="Try clearing the search query or selecting All lectures."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lectures.map((lec) => {
            const hasOpenSession = store.attendanceSessions.some(
              (s) => s.lectureId === lec.id && !s.closedAt,
            );
            return (
              <Card key={lec.id} className="flex flex-col justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={hasOpenSession ? "danger" : statusToTone(lec.state)} dot={hasOpenSession}>
                      {hasOpenSession ? "Attendance open" : lec.state}
                    </Badge>
                    <span className="text-xs text-muted tabular-nums">{formatDateTime(lec.scheduledAt)}</span>
                  </div>
                  <h2 className="mt-2.5 mb-0 text-lg font-semibold tracking-tight">
                    <Link href={`/lectures/${lec.id}`} className="text-fg no-underline hover:text-primary">
                      {lec.title}
                    </Link>
                  </h2>
                  <p className="mt-1.5 mb-0 text-sm text-fg-2">{lec.description}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <FileText aria-hidden="true" size={14} />
                    {lec.resources?.length ?? 0} resources
                  </span>
                  <div className="flex items-center gap-2">
                    <ButtonLink href={`/lectures/${lec.id}`} size="sm" variant={hasOpenSession ? "primary" : "outline"}>
                      {hasOpenSession ? (
                        <>
                          <Radio aria-hidden="true" size={14} />
                          Check in
                        </>
                      ) : (
                        "Open lecture"
                      )}
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PlatformShell>
  );
}
