"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Radio } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { OtpInput } from "@/components/ui/OtpInput.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

export default function StudentAttendancePage() {
  const { store, currentUser, checkInAttendance } = usePlatform();
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);

  const openSessions = store.attendanceSessions.filter((s) => !s.closedAt);
  const activeSession = openSessions[0] ?? null;
  const alreadyCheckedIn =
    activeSession && currentUser
      ? activeSession.records.some((r) => r.userId === currentUser.id)
      : false;

  const historyRows = store.attendanceSessions.map((sess) => {
    const rec = currentUser ? sess.records.find((r) => r.userId === currentUser.id) : null;
    const status = rec ? "Attended" : sess.closedAt ? "Missed" : "Open";
    return {
      id: sess.id,
      lectureId: sess.lectureId,
      lectureTitle: sess.lectureTitle,
      opensAt: sess.opensAt,
      submittedAt: rec?.submittedAt ?? null,
      status,
    };
  });

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!activeSession) return;
    const res = await checkInAttendance(activeSession.lectureId, code);
    if (!res.ok) {
      setFeedback({ tone: "danger", message: res.message });
      return;
    }
    setFeedback({ tone: "ok", message: `Attendance recorded for ${activeSession.lectureTitle}.` });
    setCode("");
  }

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Attendance" }]}
    >
      <PageHeader
        title="Attendance"
        description="Submit 4-digit codes during open lecture windows and review your session history."
      />

      {/* Per B4: no percentage metric computed; display raw counts cleanly */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Attended Sessions"
          value={currentUser?.attendedCount ?? 0}
          hint="Total recorded sessions"
        />
        <Stat
          label="Published Lectures"
          value={store.lectures.filter((l) => l.status === "published").length}
          hint="Cohort schedule"
        />
        <Stat
          label="Open Windows Now"
          value={openSessions.length}
          hint={openSessions.length > 0 ? "Check-in active" : "No active session"}
        />
      </section>

      {activeSession ? (
        <Card className="flex flex-col gap-4 border-primary/45">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                Live Attendance Session
              </span>
              <h2 className="m-0 mt-0.5 text-lg font-semibold">{activeSession.lectureTitle}</h2>
            </div>
            <Badge tone="danger" dot>
              Open
            </Badge>
          </div>

          {alreadyCheckedIn ? (
            <Callout tone="ok" title="Checked in">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" size={15} />
                Your attendance is recorded for this session.
              </span>
            </Callout>
          ) : (
            <form onSubmit={handleCheckIn} className="flex flex-col gap-4">
              <p className="m-0 text-sm text-fg-2">
                Enter the 4-digit session code from your instructor.
                {activeSession.code ? (
                  <>
                    {" "}
                    (Code: <code className="font-mono font-semibold text-fg">{activeSession.code}</code>)
                  </>
                ) : null}
              </p>

              {feedback ? (
                <Callout tone={feedback.tone} role={feedback.tone === "danger" ? "alert" : undefined}>
                  {feedback.message}
                </Callout>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <OtpInput
                  length={4}
                  value={code}
                  onChange={setCode}
                  label="4-digit attendance code"
                  error={feedback?.tone === "danger"}
                />
                <Button type="submit" disabled={code.length !== 4}>
                  <Radio aria-hidden="true" size={15} />
                  Submit code
                </Button>
              </div>
            </form>
          )}
        </Card>
      ) : null}

      <ResponsiveTable
        caption="Your attendance sessions"
        rows={historyRows}
        columns={[
          {
            key: "lecture",
            header: "Lecture",
            render: (row) => (
              <Link href={`/lectures/${row.lectureId}`} className="font-semibold text-fg hover:text-primary">
                {row.lectureTitle}
              </Link>
            ),
          },
          {
            key: "opened",
            header: "Session Opened",
            render: (row) => <span className="text-fg-2 tabular-nums">{formatDateTime(row.opensAt)}</span>,
          },
          {
            key: "submitted",
            header: "Submitted At",
            render: (row) => (
              <span className="text-fg-2 tabular-nums">
                {row.submittedAt ? formatDateTime(row.submittedAt) : "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <Badge tone={statusToTone(row.status)}>{row.status}</Badge>,
          },
        ]}
      />
    </PlatformShell>
  );
}
