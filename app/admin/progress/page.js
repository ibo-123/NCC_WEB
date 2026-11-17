"use client";

import { useMemo, useState } from "react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Modal } from "@/components/ui/Modal.js";
import { ProgressBar } from "@/components/ui/ProgressBar.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { statusToTone } from "@/lib/status.js";

export default function AdminProgressPage() {
  const { store } = usePlatform();
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const publishedProblems = store.problems.filter((p) => p.status === "published");

  const studentRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.users
      .filter((u) => u.role === "student")
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map((u) => {
        const solved = publishedProblems.filter(
          (p) => store.verifications[`${u.id}:${p.id}`]?.status === "solved",
        ).length;
        const pct = publishedProblems.length > 0 ? Math.round((solved / publishedProblems.length) * 100) : 0;
        return { ...u, solved, total: publishedProblems.length, pct };
      });
  }, [store.users, store.verifications, publishedProblems, query]);

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Student Progress" }]}
    >
      <PageHeader
        title="Student Progress Overview"
        description="Inspect provisional solve counts across the student cohort and drill into individual topics."
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search student name or email..."
        label="Search student progress"
      />

      <ResponsiveTable
        caption="Cohort practice progress"
        rows={studentRows}
        columns={[
          {
            key: "name",
            header: "Student",
            render: (u) => (
              <div>
                <div className="font-semibold text-fg">{u.name}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Standing",
            render: (u) => <Badge tone={statusToTone(u.status)}>{u.status}</Badge>,
          },
          {
            key: "solved",
            header: "Solved",
            align: "right",
            render: (u) => (
              <span className="font-mono font-semibold tabular-nums">
                {u.solved} / {u.total}
              </span>
            ),
          },
          {
            key: "bar",
            header: "Completion",
            render: (u) => (
              <div className="min-w-[140px]">
                <ProgressBar value={u.pct} label={`${u.name} completion`} />
              </div>
            ),
          },
          {
            key: "actions",
            header: "Details",
            align: "right",
            render: (u) => (
              <Button size="sm" variant="outline" onClick={() => setSelectedStudent(u)}>
                Inspect
              </Button>
            ),
          },
        ]}
      />

      <Modal
        open={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent ? `${selectedStudent.name} · Topic Breakdown` : ""}
        maxWidth="max-w-[560px]"
        footer={
          <Button variant="outline" onClick={() => setSelectedStudent(null)}>
            Close
          </Button>
        }
      >
        {selectedStudent ? (
          <div className="flex flex-col gap-3">
            {store.topics.map((topic) => {
              const topicProbs = publishedProblems.filter((p) => p.topicId === topic.id);
              const solved = topicProbs.filter(
                (p) => store.verifications[`${selectedStudent.id}:${p.id}`]?.status === "solved",
              ).length;
              const pct = topicProbs.length > 0 ? Math.round((solved / topicProbs.length) * 100) : 0;
              return (
                <div key={topic.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-fg">{topic.name}</span>
                    <span className="font-mono text-xs text-fg-2 tabular-nums">
                      {solved} / {topicProbs.length}
                    </span>
                  </div>
                  <ProgressBar value={pct} label={`${topic.name} progress`} />
                </div>
              );
            })}
          </div>
        ) : null}
      </Modal>
    </PlatformShell>
  );
}
