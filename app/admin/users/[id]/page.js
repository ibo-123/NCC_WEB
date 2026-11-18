"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { Modal } from "@/components/ui/Modal.js";
import { ProgressBar } from "@/components/ui/ProgressBar.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, formatShortDate, statusToTone } from "@/lib/status.js";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const { store, reopenUser } = usePlatform();
  const [confirmReopen, setConfirmReopen] = useState(false);

  const user = store.users.find((u) => u.id === id);
  const team = user
    ? store.teams.find((t) => t.status === "active" && t.members.some((m) => m.userId === user.id))
    : null;
  const history = user ? (store.ratingHistory[user.id] ?? []) : [];

  const publishedProblems = store.problems.filter((p) => p.status === "published");
  const solvedCount = user
    ? publishedProblems.filter((p) => store.verifications[`${user.id}:${p.id}`]?.status === "solved").length
    : 0;
  const pct = publishedProblems.length > 0 ? Math.round((solvedCount / publishedProblems.length) * 100) : 0;

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Users", href: "/admin/users" },
        { label: user?.name ?? "User" },
      ]}
    >
      {!user ? (
        <EmptyState
          title="User not found"
          description="No account exists with this ID."
          action={<ButtonLink href="/admin/users">Back to users</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={user.name}
            description={user.email}
            actions={
              <>
                <ButtonLink href="/admin/users" variant="outline" size="sm">
                  <ArrowLeft aria-hidden="true" size={15} />
                  All users
                </ButtonLink>
                {user.status === "restricted" ? (
                  <Button size="sm" onClick={() => setConfirmReopen(true)}>
                    Reopen account
                  </Button>
                ) : null}
              </>
            }
          />

          {user.status === "restricted" ? (
            <Callout tone="danger" title="Restricted standing">
              {user.restrictedReason || "Account is currently restricted."} (Restricted{" "}
              {formatShortDate(user.restrictedAt)})
            </Callout>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="m-0 text-base font-semibold">Account Profile</h2>
                <Badge tone={statusToTone(user.status)} dot={user.status === "restricted"}>
                  {user.status}
                </Badge>
              </div>
              <dl className="m-0 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Role</dt>
                  <dd className="m-0 mt-1 capitalize">{user.role}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Official Rating</dt>
                  <dd className="m-0 mt-1 font-mono font-semibold tabular-nums">
                    {user.rating !== null && user.rating !== undefined ? user.rating.toFixed(2) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Codeforces</dt>
                  <dd className="m-0 mt-1 font-mono text-fg-2">{user.handles?.codeforces ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">LeetCode</dt>
                  <dd className="m-0 mt-1 font-mono text-fg-2">{user.handles?.leetcode ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Team</dt>
                  <dd className="m-0 mt-1">{team ? team.name : "None"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Last Login</dt>
                  <dd className="m-0 mt-1 text-xs text-fg-2 tabular-nums">{formatDateTime(user.lastLoginAt)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="flex flex-col justify-between gap-4">
              <div>
                <h2 className="m-0 text-base font-semibold">Practice &amp; Attendance</h2>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-2">Published problems solved</span>
                    <strong className="font-mono tabular-nums">
                      {solvedCount} / {publishedProblems.length}
                    </strong>
                  </div>
                  <ProgressBar value={pct} label="Solved problems" />
                </div>
              </div>
              <div className="border-t border-border pt-3 text-sm text-fg-2">
                Attendance recorded: <strong className="font-mono text-fg tabular-nums">{user.attendedCount ?? 0}</strong> sessions
              </div>
            </Card>
          </section>

          <ResponsiveTable
            caption="Rating snapshots"
            rows={history}
            empty="No rating history recorded for this user."
            columns={[
              {
                key: "date",
                header: "Computed",
                render: (r) => <span className="text-fg-2 tabular-nums">{formatDateTime(r.computedAt)}</span>,
              },
              {
                key: "value",
                header: "Rating",
                align: "right",
                render: (r) => <strong className="font-mono tabular-nums">{r.value.toFixed(2)}</strong>,
              },
              {
                key: "change",
                header: "Change",
                align: "right",
                render: (r) =>
                  r.change === null || r.change === undefined ? (
                    "—"
                  ) : (
                    <span className={`font-mono font-semibold tabular-nums ${r.change >= 0 ? "text-up" : "text-down"}`}>
                      {r.change >= 0 ? "+" : ""}
                      {r.change.toFixed(2)}
                    </span>
                  ),
              },
              {
                key: "source",
                header: "Source",
                render: (r) => <Badge tone="neutral">{r.source}</Badge>,
              },
            ]}
          />

          <Modal
            open={confirmReopen}
            onClose={() => setConfirmReopen(false)}
            title={`Reopen ${user.name}?`}
            description="Restores full platform access for this student and records an audit log entry."
            footer={
              <>
                <Button variant="outline" onClick={() => setConfirmReopen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    reopenUser(user.id);
                    setConfirmReopen(false);
                  }}
                >
                  Confirm reopen
                </Button>
              </>
            }
          />
        </>
      )}
    </PlatformShell>
  );
}
