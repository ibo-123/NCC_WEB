"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate, statusToTone } from "@/lib/status.js";

export default function AdminTeamDetailPage() {
  const { id } = useParams();
  const { store, disbandTeam } = usePlatform();
  const [confirmDisband, setConfirmDisband] = useState(false);

  const team = store.teams.find((t) => t.id === id);

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Teams", href: "/admin/teams" },
        { label: team?.name ?? "Team" },
      ]}
    >
      {!team ? (
        <EmptyState
          title="Team not found"
          description="No team exists with this ID."
          action={<ButtonLink href="/admin/teams">Back to teams</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={team.name}
            description={`Slug: ${team.slug} · Invite code: ${team.inviteCode}`}
            actions={
              <>
                <ButtonLink href="/admin/teams" variant="outline" size="sm">
                  <ArrowLeft aria-hidden="true" size={15} />
                  All teams
                </ButtonLink>
                {team.status === "active" ? (
                  <Button size="sm" variant="danger" onClick={() => setConfirmDisband(true)}>
                    Force disband
                  </Button>
                ) : null}
              </>
            }
          />

          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="flex flex-col justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">Status</span>
              <div>
                <Badge tone={statusToTone(team.status)}>{team.status}</Badge>
              </div>
              <span className="text-xs text-fg-2">Group competition status</span>
            </Card>
            <Stat
              label="Members"
              value={`${team.members.length} / ${team.maxMembers}`}
              hint="Active roster"
            />
            <Stat
              label="Team Streak"
              value={`${team.streak?.current ?? 0} days`}
              hint={`Longest ${team.streak?.longest ?? 0} days`}
            />
          </section>

          <ResponsiveTable
            caption="Team roster"
            rows={team.members}
            rowKey={(m) => m.userId}
            empty="This team has no active members."
            columns={[
              {
                key: "name",
                header: "Member",
                render: (m) => <span className="font-semibold text-fg">{m.name}</span>,
              },
              {
                key: "role",
                header: "Role",
                render: (m) => (
                  <Badge tone={m.role === "captain" ? "warning" : "neutral"}>{m.role}</Badge>
                ),
              },
              {
                key: "handle",
                header: "Codeforces Handle",
                render: (m) => <code className="font-mono text-xs text-fg-2">{m.handles?.codeforces ?? "—"}</code>,
              },
              {
                key: "joinedAt",
                header: "Joined",
                render: (m) => <span className="text-fg-2 tabular-nums">{formatShortDate(m.joinedAt)}</span>,
              },
            ]}
          />

          <Modal
            open={confirmDisband}
            onClose={() => setConfirmDisband(false)}
            title={`Force disband ${team.name}?`}
            description="This immediately disbands the team and removes all active members."
            footer={
              <>
                <Button variant="outline" onClick={() => setConfirmDisband(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await disbandTeam(team.id);
                    setConfirmDisband(false);
                  }}
                >
                  Confirm disband
                </Button>
              </>
            }
          />
        </>
      )}
    </PlatformShell>
  );
}
