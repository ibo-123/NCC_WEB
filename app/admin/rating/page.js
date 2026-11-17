"use client";

import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Callout } from "@/components/ui/Callout.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { StarRating } from "@/components/ui/StarRating.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate, statusToTone } from "@/lib/status.js";

export default function AdminRatingPage() {
  const { store } = usePlatform();

  const rows = store.users
    .filter((u) => u.role === "student")
    .map((u) => {
      const latest = (store.ratingHistory[u.id] ?? [])[0] ?? null;
      return { ...u, latest };
    });

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Rating Overview" }]}
    >
      <PageHeader
        title="Cohort Ratings"
        description="Stored student ratings (1.00–5.00 scale) and latest component snapshots."
      />

      <Callout tone="info" title="Formula governance">
        Batch rating recalculation is governed by the approved term formula specification; this table reflects the latest stored cohort snapshots.
      </Callout>

      <ResponsiveTable
        caption="Stored student ratings"
        rows={rows}
        columns={[
          {
            key: "name",
            header: "Student",
            render: (u) => (
              <Link href={`/admin/users/${u.id}`} className="font-semibold text-fg hover:text-primary">
                {u.name}
              </Link>
            ),
          },
          {
            key: "status",
            header: "Standing",
            render: (u) => <Badge tone={statusToTone(u.status)}>{u.status}</Badge>,
          },
          {
            key: "rating",
            header: "Rating",
            align: "right",
            render: (u) => (
              <div className="inline-flex items-center gap-2">
                <strong className="font-mono tabular-nums">
                  {u.rating !== null && u.rating !== undefined ? u.rating.toFixed(2) : "—"}
                </strong>
                {u.rating ? <StarRating value={u.rating} /> : null}
              </div>
            ),
          },
          {
            key: "delta",
            header: "Last Delta",
            align: "right",
            render: (u) => {
              const ch = u.latest?.change;
              if (ch === null || ch === undefined) return <span className="text-muted">—</span>;
              return (
                <span className={`font-mono font-semibold tabular-nums ${ch >= 0 ? "text-up" : "text-down"}`}>
                  {ch >= 0 ? "+" : ""}
                  {ch.toFixed(2)}
                </span>
              );
            },
          },
          {
            key: "computedAt",
            header: "Last Snapshot",
            render: (u) => (
              <span className="text-xs text-muted tabular-nums">
                {u.latest ? formatShortDate(u.latest.computedAt) : "—"}
              </span>
            ),
          },
        ]}
      />
    </PlatformShell>
  );
}
