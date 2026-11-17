"use client";

import { useMemo, useState } from "react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Button } from "@/components/ui/Button.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

const PAGE_SIZE = 10;

export default function AdminAuditLogPage() {
  const { store } = usePlatform();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.auditLogs.filter((entry) => {
      if (!q) return true;
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.entityType.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        (entry.actor?.name ?? "").toLowerCase().includes(q) ||
        entry.correlationId.toLowerCase().includes(q)
      );
    });
  }, [store.auditLogs, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Audit log" }]}
    >
      <PageHeader
        title="Audit Log"
        description="Immutable log of administrative actions, actors, affected entities, and correlation IDs."
      />

      <SearchInput
        value={query}
        onChange={(val) => {
          setQuery(val);
          setPage(1);
        }}
        placeholder="Search by action, entity, actor, or correlation ID..."
        label="Search audit log"
      />

      <ResponsiveTable
        caption="Administrative audit log"
        rows={pageRows}
        empty="No matching audit events."
        columns={[
          {
            key: "action",
            header: "Action",
            render: (row) => <code className="font-mono text-xs font-semibold text-fg">{row.action}</code>,
          },
          {
            key: "entity",
            header: "Entity",
            render: (row) => <Badge tone="neutral">{row.entityType}</Badge>,
          },
          {
            key: "summary",
            header: "Summary",
            render: (row) => <span className="text-sm text-fg">{row.summary}</span>,
          },
          {
            key: "actor",
            header: "Actor",
            render: (row) => <span className="text-sm text-fg-2">{row.actor?.name ?? "System"}</span>,
          },
          {
            key: "correlation",
            header: "Correlation ID",
            render: (row) => <code className="font-mono text-xs text-muted">{row.correlationId}</code>,
          },
          {
            key: "createdAt",
            header: "Timestamp",
            render: (row) => <span className="text-xs text-muted tabular-nums">{formatDateTime(row.createdAt)}</span>,
          },
        ]}
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </PlatformShell>
  );
}
