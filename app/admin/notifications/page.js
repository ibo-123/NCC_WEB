"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "standing", label: "Standing" },
  { id: "teams", label: "Teams" },
  { id: "results", label: "Results" },
  { id: "attendance", label: "Attendance" },
  { id: "content", label: "Content" },
  { id: "security", label: "Security" },
];

function classifyAudit(action) {
  if (action.startsWith("user.")) return "standing";
  if (action.startsWith("team.")) return "teams";
  if (action.startsWith("results.")) return "results";
  if (action.startsWith("attendance.")) return "attendance";
  if (action.startsWith("twofa.")) return "security";
  return "content";
}

export default function AdminNotificationsPage() {
  const { store } = usePlatform();
  const [category, setCategory] = useState("all");

  const items = useMemo(() => {
    return store.auditLogs.filter((entry) => {
      if (category === "all") return true;
      return classifyAudit(entry.action) === category;
    });
  }, [store.auditLogs, category]);

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Notifications" }]}
    >
      <PageHeader
        title="Admin Notifications"
        description="Chronological audit feed grouped across standing, teams, results, attendance, content, and security."
      />

      <Tabs
        items={CATEGORIES}
        activeId={category}
        onChange={setCategory}
        ariaLabel="Filter admin notifications by category"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No events in this category"
          description="Select another category to inspect recorded platform events."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((entry) => (
            <Card key={entry.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{classifyAudit(entry.action)}</Badge>
                  <code className="font-mono text-xs text-muted">{entry.action}</code>
                  <span className="text-xs text-muted tabular-nums">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-2 mb-0 text-sm font-semibold text-fg">{entry.summary}</p>
                <p className="mt-0.5 mb-0 text-xs text-muted">
                  Actor: {entry.actor?.name ?? "System"} · Correlation {entry.correlationId}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
