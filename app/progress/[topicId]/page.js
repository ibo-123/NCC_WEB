"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { statusToTone } from "@/lib/status.js";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "solved", label: "Solved" },
  { id: "unsolved", label: "Unsolved" },
  { id: "pending", label: "Pending" },
];

export default function TopicProblemsPage() {
  const { topicId } = useParams();
  const { store, currentUser } = usePlatform();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const topic = store.topics.find((t) => t.id === topicId);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.problems
      .filter((p) => p.status === "published" && p.topicId === topicId)
      .map((p) => {
        const ver = currentUser ? store.verifications[`${currentUser.id}:${p.id}`] : null;
        const st = ver?.status ?? "unsolved";
        return { ...p, verificationStatus: st, solvedAt: ver?.solvedAt ?? null };
      })
      .filter((row) => {
        if (statusFilter !== "all" && row.verificationStatus !== statusFilter) return false;
        if (q && !row.title.toLowerCase().includes(q) && !row.platform.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [store.problems, store.verifications, topicId, currentUser, query, statusFilter]);

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Progress", href: "/progress" },
        { label: topic?.name ?? "Topic" },
      ]}
    >
      {!topic ? (
        <EmptyState
          title="Topic not found"
          description="This practice topic does not exist."
          action={<ButtonLink href="/progress">Back to progress</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={topic.name}
            description="Open any problem to solve on its platform and run a provisional solve check."
            actions={
              <ButtonLink href="/progress" variant="outline" size="sm">
                <ArrowLeft aria-hidden="true" size={15} />
                All topics
              </ButtonLink>
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search problems..."
              label="Search topic problems"
            />
            <Tabs
              items={STATUS_TABS}
              activeId={statusFilter}
              onChange={setStatusFilter}
              ariaLabel="Filter problems by verification status"
            />
          </div>

          <ResponsiveTable
            caption={`${topic.name} problems`}
            rows={rows}
            empty="No problems match your filters in this topic."
            columns={[
              {
                key: "title",
                header: "Problem",
                render: (row) => (
                  <Link href={`/problems/${row.id}`} className="font-semibold text-fg hover:text-primary">
                    {row.title}
                  </Link>
                ),
              },
              {
                key: "platform",
                header: "Platform",
                render: (row) => (
                  <span className="capitalize text-fg-2">
                    {row.platform}
                    {row.externalRef?.contestId ? ` #${row.externalRef.contestId}${row.externalRef.index}` : ""}
                  </span>
                ),
              },
              {
                key: "value",
                header: "Points",
                align: "right",
                render: (row) => <span className="font-mono tabular-nums">{row.value ?? "—"}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={statusToTone(row.verificationStatus)}>{row.verificationStatus}</Badge>
                ),
              },
              {
                key: "action",
                header: "Actions",
                align: "right",
                render: (row) => (
                  <div className="inline-flex items-center gap-2">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-fg-2 hover:text-fg"
                    >
                      Problem
                      <ExternalLink aria-hidden="true" size={12} />
                    </a>
                    <ButtonLink href={`/problems/${row.id}`} size="sm" variant="outline">
                      Check
                    </ButtonLink>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}
    </PlatformShell>
  );
}
