"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { Button } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate, statusToTone } from "@/lib/status.js";

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "important", label: "Important" },
  { id: "contest", label: "Contest" },
  { id: "lecture", label: "Lecture" },
  { id: "attendance", label: "Attendance" },
];

const PAGE_SIZE = 6;

export default function AnnouncementsPage() {
  const { store } = usePlatform();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.announcements.filter((a) => {
      if (a.status !== "published") return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [store.announcements, query, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Announcements" }]}
    >
      <PageHeader
        title="Announcements"
        description="Cohort-wide notices, contest invitations, lecture releases, and attendance reminders."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={(val) => {
            setQuery(val);
            setPage(1);
          }}
          placeholder="Search announcements..."
          label="Search announcements"
        />
        <Tabs
          items={TYPE_TABS}
          activeId={typeFilter}
          onChange={(next) => {
            setTypeFilter(next);
            setPage(1);
          }}
          ariaLabel="Filter announcements by type"
        />
      </div>

      {pageItems.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No matching announcements"
          description="Try clearing your search term or switching back to all announcement types."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setTypeFilter("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pageItems.map((item) => (
            <Card key={item.id} important={item.type === "important"}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={statusToTone(item.type)}>{item.type}</Badge>
                  <span className="text-xs text-muted tabular-nums">
                    Published {formatShortDate(item.publishedAt)}
                  </span>
                </div>
                <span className="text-xs text-muted">By {item.createdBy}</span>
              </div>
              <h2 className="mt-2.5 mb-0 text-lg font-semibold tracking-tight">
                <Link href={`/announcements/${item.id}`} className="text-fg no-underline hover:text-primary">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-1.5 mb-0 text-sm leading-relaxed text-fg-2">{item.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <Link href={`/announcements/${item.id}`} className="font-semibold text-primary">
                  Read notice
                </Link>
                {item.relatedHref ? (
                  <Link href={item.relatedHref} className="text-fg-2 hover:text-fg">
                    Open related page
                  </Link>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2 text-sm">
          <span className="text-muted tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </PlatformShell>
  );
}
