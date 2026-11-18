"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate } from "@/lib/status.js";

export default function AdminRestrictedPage() {
  const { store, reopenUser } = usePlatform();
  const [reopenTarget, setReopenTarget] = useState(null);

  const restricted = store.users.filter((u) => u.status === "restricted");

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Restricted accounts" }]}
    >
      <PageHeader
        title="Restricted Accounts"
        description="Students currently paused from cohort access. Reopening restores full portal access."
      />

      {restricted.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No restricted accounts"
          description="All student accounts currently have active standing."
        />
      ) : (
        <ResponsiveTable
          caption="Restricted accounts"
          rows={restricted}
          columns={[
            {
              key: "name",
              header: "Student",
              render: (u) => (
                <div>
                  <Link href={`/admin/users/${u.id}`} className="font-semibold text-fg hover:text-primary">
                    {u.name}
                  </Link>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
              ),
            },
            {
              key: "rating",
              header: "Rating",
              align: "right",
              render: (u) => (
                <span className="font-mono font-semibold text-error tabular-nums">
                  {u.rating !== null && u.rating !== undefined ? u.rating.toFixed(2) : "—"}
                </span>
              ),
            },
            {
              key: "reason",
              header: "Reason",
              render: (u) => <span className="text-sm text-fg-2">{u.restrictedReason ?? "Standing review"}</span>,
            },
            {
              key: "since",
              header: "Restricted Since",
              render: (u) => (
                <span className="text-xs text-muted tabular-nums">{formatShortDate(u.restrictedAt)}</span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: () => <Badge tone="danger" dot>restricted</Badge>,
            },
            {
              key: "actions",
              header: "Action",
              align: "right",
              render: (u) => (
                <Button size="sm" onClick={() => setReopenTarget(u)}>
                  Reopen
                </Button>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={Boolean(reopenTarget)}
        onClose={() => setReopenTarget(null)}
        title={`Reopen ${reopenTarget?.name}?`}
        description="This restores student access immediately and creates an audit log entry."
        footer={
          <>
            <Button variant="outline" onClick={() => setReopenTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (reopenTarget) reopenUser(reopenTarget.id);
                setReopenTarget(null);
              }}
            >
              Confirm reopen
            </Button>
          </>
        }
      />
    </PlatformShell>
  );
}
