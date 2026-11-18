"use client";

import { useState } from "react";
import { Check, Copy, Crown, LogOut, Trash2, UserMinus, Users } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Field } from "@/components/ui/Field.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate } from "@/lib/status.js";

export default function TeamsPage() {
  const {
    currentUser,
    currentTeam,
    createTeam,
    joinTeam,
    leaveTeam,
    removeTeamMember,
    transferCaptaincy,
    disbandTeam,
  } = usePlatform();

  const [teamName, setTeamName] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);

  const [confirmModal, setConfirmModal] = useState(null); // { type: 'leave' | 'disband' | 'remove' | 'transfer', member? }

  const isCaptain = Boolean(currentUser && currentTeam && currentTeam.captainId === currentUser.id);

  function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    const res = createTeam(teamName);
    if (!res.ok) {
      setCreateError(res.error);
      return;
    }
    setTeamName("");
  }

  function handleJoin(e) {
    e.preventDefault();
    setJoinError("");
    const res = joinTeam(inviteInput);
    if (!res.ok) {
      setJoinError(res.error);
      return;
    }
    setInviteInput("");
  }

  function copyCode() {
    if (!currentTeam) return;
    navigator.clipboard?.writeText(currentTeam.inviteCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function executeModalAction() {
    if (!confirmModal) return;
    if (confirmModal.type === "leave") {
      const res = leaveTeam();
      if (!res.ok) {
        setJoinError(res.error);
      }
    } else if (confirmModal.type === "disband") {
      disbandTeam(currentTeam?.id);
    } else if (confirmModal.type === "remove" && confirmModal.member) {
      removeTeamMember(confirmModal.member.userId);
    } else if (confirmModal.type === "transfer" && confirmModal.member) {
      transferCaptaincy(confirmModal.member.userId);
    }
    setConfirmModal(null);
  }

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My team" }]}
    >
      <PageHeader
        title="My Team"
        description="Group competition track for teams of up to 5 students. Share an 8-character invite code with teammates."
        actions={
          currentTeam ? (
            <div className="flex flex-wrap gap-2">
              {isCaptain ? (
                <Button variant="danger" size="sm" onClick={() => setConfirmModal({ type: "disband" })}>
                  <Trash2 aria-hidden="true" size={14} />
                  Disband team
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmModal({ type: "leave" })}>
                  <LogOut aria-hidden="true" size={14} />
                  Leave team
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {!currentTeam ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Users aria-hidden="true" size={18} className="text-primary" />
              <h2 className="m-0 text-lg font-semibold">Create a new team</h2>
            </div>
            <p className="m-0 text-sm text-fg-2">
              You become team captain and receive an 8-character invite code to share with up to 4 teammates.
            </p>
            {createError ? <Callout tone="danger" role="alert">{createError}</Callout> : null}
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <Field
                label="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Binary Hawks"
              />
              <div>
                <Button type="submit">Create team</Button>
              </div>
            </form>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="m-0 text-lg font-semibold">Join with invite code</h2>
            <p className="m-0 text-sm text-fg-2">
              Enter an 8-character invite code from your team captain. Sample open team code:{" "}
              <code className="font-mono font-semibold text-fg">STCK9P4R</code>
            </p>
            {joinError ? <Callout tone="danger" role="alert">{joinError}</Callout> : null}
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <Field
                label="Invite code"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                placeholder="8-character code"
                maxLength={8}
                className="[&_input]:font-mono [&_input]:uppercase"
              />
              <div>
                <Button type="submit" variant="outline">Join team</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Team Name"
              value={currentTeam.name}
              hint={isCaptain ? "You are team captain" : "Active member"}
            />
            <Stat
              label="Roster Capacity"
              value={`${currentTeam.members.length} / ${currentTeam.maxMembers}`}
              hint={`${currentTeam.maxMembers - currentTeam.members.length} open slot(s)`}
            />
            <Card className="flex flex-col justify-between gap-2">
              <div className="text-xs font-semibold tracking-wider text-muted uppercase">Invite Code</div>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-2xl font-semibold tracking-wider text-fg">
                  {currentTeam.inviteCode}
                </code>
                <Button size="sm" variant="outline" onClick={copyCode} aria-label="Copy invite code">
                  {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="text-xs text-fg-2">Share to invite up to {currentTeam.maxMembers} members</div>
            </Card>
          </section>

          {joinError ? <Callout tone="danger" role="alert">{joinError}</Callout> : null}

          <ResponsiveTable
            caption={`${currentTeam.name} roster`}
            rows={currentTeam.members}
            rowKey={(m) => m.userId}
            highlight={(m) => Boolean(currentUser && m.userId === currentUser.id)}
            columns={[
              {
                key: "name",
                header: "Member",
                render: (m) => (
                  <span className="inline-flex items-center gap-2 font-semibold text-fg">
                    {m.name}
                    {currentUser && m.userId === currentUser.id ? <Badge tone="info">You</Badge> : null}
                  </span>
                ),
              },
              {
                key: "role",
                header: "Role",
                render: (m) => (
                  <Badge tone={m.role === "captain" ? "warning" : "neutral"}>
                    {m.role === "captain" ? "Captain" : "Member"}
                  </Badge>
                ),
              },
              {
                key: "handle",
                header: "Codeforces Handle",
                render: (m) => (
                  <code className="font-mono text-xs text-fg-2">{m.handles?.codeforces ?? "Unlinked"}</code>
                ),
              },
              {
                key: "joinedAt",
                header: "Joined",
                render: (m) => <span className="text-fg-2 tabular-nums">{formatShortDate(m.joinedAt)}</span>,
              },
              ...(isCaptain
                ? [
                    {
                      key: "actions",
                      header: "Captain Actions",
                      align: "right",
                      render: (m) =>
                        m.userId === currentUser?.id ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmModal({ type: "transfer", member: m })}
                            >
                              <Crown aria-hidden="true" size={13} />
                              Make captain
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmModal({ type: "remove", member: m })}
                            >
                              <UserMinus aria-hidden="true" size={13} />
                              Remove
                            </Button>
                          </div>
                        ),
                    },
                  ]
                : []),
            ]}
          />

          <Modal
            open={Boolean(confirmModal)}
            onClose={() => setConfirmModal(null)}
            title={
              confirmModal?.type === "disband"
                ? `Disband ${currentTeam.name}?`
                : confirmModal?.type === "leave"
                  ? `Leave ${currentTeam.name}?`
                  : confirmModal?.type === "transfer"
                    ? `Transfer captaincy to ${confirmModal.member?.name}?`
                    : `Remove ${confirmModal?.member?.name}?`
            }
            description={
              confirmModal?.type === "disband"
                ? "Disbanding marks the team disbanded and removes all members from the roster."
                : confirmModal?.type === "leave"
                  ? "You will leave the active roster and can join or create another team."
                  : confirmModal?.type === "transfer"
                    ? "You will become a regular team member and relinquish captain controls."
                    : "This member will be removed from the active team roster."
            }
            footer={
              <>
                <Button variant="outline" onClick={() => setConfirmModal(null)}>
                  Cancel
                </Button>
                <Button
                  variant={confirmModal?.type === "disband" || confirmModal?.type === "remove" ? "danger" : "primary"}
                  onClick={executeModalAction}
                >
                  Confirm
                </Button>
              </>
            }
          />
        </>
      )}
    </PlatformShell>
  );
}
