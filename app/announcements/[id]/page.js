"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const { store } = usePlatform();

  const item = store.announcements.find((a) => a.id === id && a.status === "published");

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Announcements", href: "/announcements" },
        { label: item?.title ?? "Notice" },
      ]}
    >
      {!item ? (
        <EmptyState
          title="Announcement not found"
          description="This announcement may have been removed or is not yet published."
          action={<ButtonLink href="/announcements">Back to announcements</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={item.title}
            actions={
              <ButtonLink href="/announcements" variant="outline" size="sm">
                <ArrowLeft aria-hidden="true" size={15} />
                All announcements
              </ButtonLink>
            }
          />
          <Card important={item.type === "important"} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
              <Badge tone={statusToTone(item.type)}>{item.type}</Badge>
              <span className="text-xs text-muted">
                Published {formatDateTime(item.publishedAt)} · Posted by {item.createdBy}
              </span>
            </div>
            <p className="m-0 max-w-[68ch] text-base leading-relaxed text-fg">{item.body}</p>
            {item.relatedHref ? (
              <div className="pt-2">
                <ButtonLink href={item.relatedHref}>
                  Go to related page
                  <ArrowRight aria-hidden="true" size={15} />
                </ButtonLink>
              </div>
            ) : null}
          </Card>
        </>
      )}
    </PlatformShell>
  );
}
