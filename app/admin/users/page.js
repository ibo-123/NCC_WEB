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
  { id: "restricted", label: "Restricted" },
];

export default function AdminUsersPage() {
  const { store, reopenUser } = usePlatform();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [reopenTarget, setReopenTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.handles?.codeforces ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [store.users, query, statusFilter, roleFilter]);

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
    >
      <PageHeader
        title="Users"
        description="Inspect student and administrator accounts, linked Codeforces handles, and reopen restricted accounts."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, email, or Codeforces handle..."
          label="Search users"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            items={STATUS_TABS}
            activeId={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter users by status"
          />
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-[2px] border border-border-strong bg-surface px-3 font-mono text-[13px] text-fg"
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <ResponsiveTable
        caption="Platform user directory"
        rows={filtered}
        empty="No users match the active filters."
        columns={[
          {
            key: "name",
            header: "User",
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
            key: "role",
            header: "Role",
            render: (u) => <span className="capitalize text-fg-2">{u.role}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (u) => <Badge tone={statusToTone(u.status)} dot={u.status === "restricted"}>{u.status}</Badge>,
          },
          {
            key: "rating",
            header: "Rating",
            align: "right",
            render: (u) => (
              <span className="font-mono tabular-nums">
                {u.rating !== null && u.rating !== undefined ? u.rating.toFixed(2) : "—"}
              </span>
            ),
          },
          {
            key: "handle",
            header: "Codeforces",
            render: (u) => <code className="font-mono text-xs text-fg-2">{u.handles?.codeforces ?? "—"}</code>,
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (u) => (
              <div className="inline-flex items-center gap-2">
                <ButtonLink href={`/admin/users/${u.id}`} size="sm" variant="outline">
                  View
                </ButtonLink>
                {u.status === "restricted" ? (
                  <Button size="sm" onClick={() => setReopenTarget(u)}>
                    Reopen
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={Boolean(reopenTarget)}
        onClose={() => setReopenTarget(null)}
        title={`Reopen ${reopenTarget?.name}?`}
        description="Restores full student access to lectures, attendance, practice, and contests."
        footer={
          <>
            <Button variant="outline" onClick={() => setReopenTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (reopenTarget) await reopenUser(reopenTarget.id);
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
