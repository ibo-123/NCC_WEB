"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Square } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Field } from "@/components/ui/Field.js";
import { Modal } from "@/components/ui/Modal.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Callout } from "@/components/ui/Callout.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

function formatRemaining(expiresAt, nowMs) {
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - nowMs) / 1000));
  if (diff > 86400) return "Open (demo window)";
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AdminAttendancePage() {
  const { store, startAttendanceSession, closeAttendanceSession } = usePlatform();
  const [startOpen, setStartOpen] = useState(false);
  const [lectureId, setLectureId] = useState(store.lectures[1]?.id ?? store.lectures[0]?.id ?? "");
  const [validSeconds, setValidSeconds] = useState("600");
  const [startError, setStartError] = useState("");
  const [query, setQuery] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const openSessions = store.attendanceSessions.filter((s) => !s.closedAt);

  const submissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [];
    for (const sess of store.attendanceSessions) {
      for (const rec of sess.records) {
        if (q && !rec.name.toLowerCase().includes(q) && !sess.lectureTitle.toLowerCase().includes(q)) {
          continue;
        }
        rows.push({
          id: `${sess.id}-${rec.userId}`,
          studentName: rec.name,
          lectureTitle: sess.lectureTitle,
          submittedAt: rec.submittedAt,
          sessionOpen: !sess.closedAt,
        });
      }
    }
    return rows;
  }, [store.attendanceSessions, query]);

  function handleStart(e) {
    e.preventDefault();
    setStartError("");
    const res = startAttendanceSession(lectureId, Number(validSeconds) || 600);
    if (!res.ok) {
      setStartError(res.error);
      return;
    }
    setStartOpen(false);
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Attendance" }]}
    >
      <PageHeader
        title="Attendance Sessions"
        description="Start timed 4-digit check-in windows for lectures, monitor submissions, or end active sessions."
        actions={
          <Button
            onClick={() => {
              setStartError("");
              setStartOpen(true);
            }}
          >
            <Play aria-hidden="true" size={15} />
            Start session
          </Button>
        }
      />

      {openSessions.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {openSessions.map((sess) => (
            <Card key={sess.id} className="flex flex-col gap-3 border-primary/45">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="danger" dot>
                    Live session
                  </Badge>
                  <h2 className="mt-2 mb-0 text-lg font-semibold">{sess.lectureTitle}</h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => closeAttendanceSession(sess.id)}>
                  <Square aria-hidden="true" size={13} />
                  End session
                </Button>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-sunken px-4 py-3">
                <div>
                  <span className="block text-xs font-semibold tracking-wider text-muted uppercase">
                    4-Digit Code
                  </span>
                  <code className="font-mono text-3xl font-semibold tracking-[0.25em] text-fg">
                    {sess.code}
                  </code>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold tracking-wider text-muted uppercase">
                    Remaining
                  </span>
                  <span className="font-mono text-base font-semibold text-fg tabular-nums">
                    {formatRemaining(sess.expiresAt, nowMs)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted">
                {sess.records.length} student check-in(s) recorded
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter submissions by student or lecture..."
        label="Search attendance records"
      />

      <ResponsiveTable
        caption="Recorded attendance submissions"
        rows={submissions}
        empty="No attendance submissions recorded."
        columns={[
          {
            key: "student",
            header: "Student",
            render: (r) => <span className="font-semibold text-fg">{r.studentName}</span>,
          },
          {
            key: "lecture",
            header: "Lecture",
            render: (r) => <span className="text-fg-2">{r.lectureTitle}</span>,
          },
          {
            key: "submittedAt",
            header: "Submitted",
            render: (r) => <span className="text-xs text-muted tabular-nums">{formatDateTime(r.submittedAt)}</span>,
          },
          {
            key: "status",
            header: "Window",
            render: (r) => (
              <Badge tone={r.sessionOpen ? "info" : "completed"}>
                {r.sessionOpen ? "Open" : "Closed"}
              </Badge>
            ),
          },
        ]}
      />

      <Modal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start attendance session"
        description="Generates a 4-digit check-in code valid for the selected duration."
      >
        <form onSubmit={handleStart} className="flex flex-col gap-4">
          {startError ? <Callout tone="danger" role="alert">{startError}</Callout> : null}

          <Field
            label="Lecture"
            as="select"
            value={lectureId}
            onChange={(e) => setLectureId(e.target.value)}
          >
            {store.lectures.map((lec) => (
              <option key={lec.id} value={lec.id}>
                {lec.title}
              </option>
            ))}
          </Field>

          <Field
            label="Window duration"
            as="select"
            value={validSeconds}
            onChange={(e) => setValidSeconds(e.target.value)}
          >
            <option value="300">5 minutes</option>
            <option value="600">10 minutes</option>
            <option value="900">15 minutes</option>
            <option value="1800">30 minutes</option>
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate 4-digit code</Button>
          </div>
        </form>
      </Modal>
    </PlatformShell>
  );
}
