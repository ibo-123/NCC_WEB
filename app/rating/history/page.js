"use client";

import { ArrowLeft } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

export default function RatingHistoryPage() {
  const { store, currentUser } = usePlatform();
  const history = currentUser ? (store.ratingHistory[currentUser.id] ?? []) : [];

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rating", href: "/rating" },
        { label: "History" },
      ]}
    >
      <PageHeader
        title="Rating History"
        description="Chronological rating snapshots recorded for your account."
        actions={
          <ButtonLink href="/rating" variant="outline" size="sm">
            <ArrowLeft aria-hidden="true" size={15} />
            Back to rating
          </ButtonLink>
        }
      />

      <ResponsiveTable
        caption="Rating history snapshots"
        rows={history}
        empty="No rating history snapshots recorded yet."
        columns={[
          {
            key: "date",
            header: "Snapshot Date",
            render: (row) => <span className="text-fg-2 tabular-nums">{formatDateTime(row.computedAt)}</span>,
          },
          {
            key: "previous",
            header: "Previous",
            align: "right",
            render: (row) => (
              <span className="font-mono text-fg-2 tabular-nums">
                {row.previous !== null && row.previous !== undefined ? row.previous.toFixed(2) : "—"}
              </span>
            ),
          },
          {
            key: "value",
            header: "Rating",
            align: "right",
            render: (row) => <strong className="font-mono tabular-nums">{row.value.toFixed(2)}</strong>,
          },
          {
            key: "change",
            header: "Delta",
            align: "right",
            render: (row) => {
              if (row.change === null || row.change === undefined) return <span className="text-muted">—</span>;
              return (
                <span className={`font-mono font-semibold tabular-nums ${row.change >= 0 ? "text-up" : "text-down"}`}>
                  {row.change >= 0 ? "+" : ""}
                  {row.change.toFixed(2)}
                </span>
              );
            },
          },
          {
            key: "source",
            header: "Source",
            render: (row) => <Badge tone="neutral">{row.source}</Badge>,
          },
        ]}
      />
    </PlatformShell>
  );
}
