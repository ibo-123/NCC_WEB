"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Link2, Radio } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { OtpInput } from "@/components/ui/OtpInput.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

export default function LectureDetailPage() {
  const { id } = useParams();
  const { store, currentUser, checkInAttendance } = usePlatform();

  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);

  const lecture = store.lectures.find((l) => l.id === id && l.status === "published");
  const openSession = lecture
    ? store.attendanceSessions.find((s) => s.lectureId === lecture.id && !s.closedAt)
    : null;
  const alreadySubmitted =
    openSession && currentUser
      ? openSession.records.some((r) => r.userId === currentUser.id)
      : false;

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!lecture) return;
    const res = await checkInAttendance(lecture.id, code);
    if (!res.ok) {
      setFeedback({ tone: "danger", message: res.message });
      return;
    }
    setFeedback({ tone: "ok", message: `Attendance recorded at ${formatDateTime(res.submittedAt)}.` });
    setCode("");
  }

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Lectures", href: "/lectures" },
        { label: lecture?.title ?? "Lecture" },
      ]}
    >
      {!lecture ? (
        <EmptyState
          title="Lecture not found"
          description="This lecture does not exist or has not been published yet."
          action={<ButtonLink href="/lectures">Back to lectures</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={lecture.title}
            description={lecture.description}
            actions={
              <>
                <ButtonLink href="/lectures" variant="outline" size="sm">
                  <ArrowLeft aria-hidden="true" size={15} />
                  All lectures
                </ButtonLink>
                {lecture.liveUrl ? (
                  <a
                    href={lecture.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-transparent [background-image:var(--brand-grad)] bg-[#083b5b] px-3 font-mono text-[13px] font-semibold text-white no-underline hover:brightness-110"
                  >
                    Join meeting
                    <ExternalLink aria-hidden="true" size={14} />
                  </a>
                ) : null}
              </>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                {openSession ? (
                  <Badge tone="danger" dot>Attendance open</Badge>
                ) : lecture.state ? (
                  <Badge tone={statusToTone(lecture.state)}>{lecture.state}</Badge>
                ) : (
                  <Badge tone="published">Published</Badge>
                )}
                <span className="text-xs text-muted tabular-nums">
                  Scheduled {formatDateTime(lecture.scheduledAt)}
                </span>
              </div>

              <div>
                <h2 className="m-0 mb-2.5 text-base font-semibold">Lecture resources</h2>
                {!lecture.resources?.length ? (
                  <p className="m-0 text-sm text-muted">No resources attached yet.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {lecture.resources.map((res, idx) => (
                      <li key={`${res.title}-${idx}`}>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-[3px] border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-fg no-underline hover:bg-sunken"
                        >
                          <span className="flex items-center gap-2">
                            {res.type === "link" ? (
                              <Link2 aria-hidden="true" size={16} className="text-primary" />
                            ) : (
                              <FileText aria-hidden="true" size={16} className="text-primary" />
                            )}
                            <span>{res.title}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted uppercase">
                            {res.type}
                            <ExternalLink aria-hidden="true" size={13} />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Live attendance check-in</h2>
                {openSession ? (
                  <Badge tone="danger" dot>
                    Session open
                  </Badge>
                ) : (
                  <Badge tone="draft">Closed</Badge>
                )}
              </div>

              {!openSession ? (
                <p className="m-0 text-sm text-fg-2">
                  There is no open attendance window for this lecture right now. When an instructor opens attendance, enter the 4-digit code shown in class here.
                </p>
              ) : alreadySubmitted ? (
                <Callout tone="ok" title="Attendance recorded">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 aria-hidden="true" size={15} />
                    Your attendance for this session has already been recorded.
                  </span>
                </Callout>
              ) : (
                <form onSubmit={handleCheckIn} className="flex flex-col gap-4">
                  <p className="m-0 text-sm text-fg-2">
                    Enter the 4-digit attendance code announced during the live lecture.
                    {openSession.code ? (
                      <>
                        {" "}
                        (Active code: <code className="font-mono font-semibold text-fg">{openSession.code}</code>)
                      </>
                    ) : null}
                  </p>

                  {feedback ? (
                    <Callout tone={feedback.tone} role={feedback.tone === "danger" ? "alert" : undefined}>
                      {feedback.message}
                    </Callout>
                  ) : null}

                  <OtpInput
                    length={4}
                    value={code}
                    onChange={setCode}
                    label="4-digit attendance code"
                    error={feedback?.tone === "danger"}
                  />

                  <Button type="submit" disabled={code.length !== 4}>
                    <Radio aria-hidden="true" size={15} />
                    Submit attendance
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </>
      )}
    </PlatformShell>
  );
}
