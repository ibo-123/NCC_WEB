"use client";

import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

function typeLabel(type) {
  const map = {
    contest_published: "Contest",
    announcement_published: "Announcement",
    attendance_recorded: "Attendance",
    results_published: "Results",
    account_reopened: "Account",
    rating_updated: "Rating",
  };
  return map[type] ?? "Update";
}

export default function StudentNotificationsPage() {
  const { store, currentUser } = usePlatform();

  const items = store.notifications.filter(
    (n) => !currentUser || n.userId === currentUser.id,
  );

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
    >
      <PageHeader
        title="Notifications"
        description="Chronological platform events for your account."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Published announcements, contest alerts, and recorded attendance receipts will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{typeLabel(item.type)}</Badge>
                  <span className="text-xs text-muted tabular-nums">{formatDateTime(item.createdAt)}</span>
                </div>
                <h2 className="mt-2 mb-0 text-base font-semibold text-fg">{item.title}</h2>
                <p className="mt-1 mb-0 text-sm text-fg-2">{item.body}</p>
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary no-underline hover:underline"
                >
                  Open
                  <ArrowRight aria-hidden="true" size={14} />
                </Link>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
