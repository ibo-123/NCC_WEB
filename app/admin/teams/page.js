"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { statusToTone } from "@/lib/status.js";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "disbanded", label: "Disbanded" },
];

export default function AdminTeamsPage() {
  const { store, disbandTeam } = usePlatform();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disbandTarget, setDisbandTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.teams.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.inviteCode.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [store.teams, query, statusFilter]);

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Teams" }]}
    >
      <PageHeader
        title="Teams"
        description="Inspect student rosters, invite codes, and manage active Group competition teams."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search team name or invite code..."
          label="Search teams"
        />
        <Tabs items={STATUS_TABS} activeId={statusFilter} onChange={setStatusFilter} ariaLabel="Filter teams" />
      </div>

      <ResponsiveTable
        caption="Teams directory"
        rows={filtered}
        empty="No teams match your filters."
        columns={[
          {
            key: "name",
            header: "Team",
            render: (t) => (
              <Link href={`/admin/teams/${t.id}`} className="font-semibold text-fg hover:text-primary">
                {t.name}
              </Link>
            ),
          },
          {
            key: "inviteCode",
            header: "Invite Code",
            render: (t) => <code className="font-mono text-xs text-fg-2">{t.inviteCode}</code>,
          },
          {
            key: "members",
            header: "Members",
            align: "right",
            render: (t) => (
              <span className="font-mono tabular-nums">
                {t.members.length} / {t.maxMembers}
              </span>
            ),
          },
          {
            key: "streak",
            header: "Streak",
            align: "right",
            render: (t) => <span className="font-mono tabular-nums">{t.streak?.current ?? 0}d</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (t) => <Badge tone={statusToTone(t.status)}>{t.status}</Badge>,
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (t) => (
              <div className="inline-flex items-center gap-2">
                <ButtonLink href={`/admin/teams/${t.id}`} size="sm" variant="outline">
                  View
                </ButtonLink>
                {t.status === "active" ? (
                  <Button size="sm" variant="danger" onClick={() => setDisbandTarget(t)}>
                    Disband
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={Boolean(disbandTarget)}
        onClose={() => setDisbandTarget(null)}
        title={`Force disband ${disbandTarget?.name}?`}
        description="Marks the team disbanded, clears active memberships, and logs an administrative audit event."
        footer={
          <>
            <Button variant="outline" onClick={() => setDisbandTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (disbandTarget) await disbandTeam(disbandTarget.id);
                setDisbandTarget(null);
              }}
            >
              Disband team
            </Button>
          </>
        }
      />
    </PlatformShell>
  );
}
