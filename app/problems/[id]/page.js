"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

export default function ProblemDetailPage() {
  const { id } = useParams();
  const { store, currentUser, verifyProblem } = usePlatform();

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  const problem = store.problems.find((p) => p.id === id && p.status === "published");
  const topic = problem ? store.topics.find((t) => t.id === problem.topicId) : null;
  const verification =
    problem && currentUser ? store.verifications[`${currentUser.id}:${problem.id}`] : null;
  const status = verification?.status ?? "unsolved";

  async function runCheck() {
    if (!problem) return;
    setChecking(true);
    setCheckResult(null);
    const res = await verifyProblem(problem.id);
    setChecking(false);
    setCheckResult(res);
  }

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Progress", href: "/progress" },
        ...(topic ? [{ label: topic.name, href: `/progress/${topic.id}` }] : []),
        { label: problem?.title ?? "Problem" },
      ]}
    >
      {!problem ? (
        <EmptyState
          title="Problem not found"
          description="This problem does not exist or has not been published."
          action={<ButtonLink href="/progress">Back to progress</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={problem.title}
            description={`${topic?.name ?? "Practice"} · ${problem.platform === "codeforces" ? "Codeforces" : "LeetCode"}`}
            actions={
              <>
                {topic ? (
                  <ButtonLink href={`/progress/${topic.id}`} variant="outline" size="sm">
                    <ArrowLeft aria-hidden="true" size={15} />
                    Back to {topic.name}
                  </ButtonLink>
                ) : null}
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-transparent [background-image:var(--brand-grad)] bg-[#083b5b] px-3 font-mono text-[13px] font-semibold text-white no-underline hover:brightness-110"
                >
                  Open on {problem.platform === "codeforces" ? "Codeforces" : "LeetCode"}
                  <ExternalLink aria-hidden="true" size={14} />
                </a>
              </>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                  Problem Details
                </span>
                <Badge tone={statusToTone(status)}>{status}</Badge>
              </div>

              <dl className="m-0 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Platform</dt>
                  <dd className="m-0 mt-1 font-medium capitalize text-fg">{problem.platform}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Weight</dt>
                  <dd className="m-0 mt-1 font-mono font-semibold text-fg tabular-nums">
                    {problem.value ?? "—"} pts
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Reference</dt>
                  <dd className="m-0 mt-1 font-mono text-fg-2">
                    {problem.externalRef?.contestId
                      ? `${problem.externalRef.contestId}${problem.externalRef.index}`
                      : problem.externalRef?.titleSlug ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Linked Handle</dt>
                  <dd className="m-0 mt-1 font-mono text-fg-2">
                    {problem.platform === "codeforces"
                      ? currentUser?.handles?.codeforces ?? "Not linked"
                      : currentUser?.handles?.leetcode ?? "Not linked"}
                  </dd>
                </div>
              </dl>

              {verification?.lastCheckedAt ? (
                <p className="m-0 border-t border-border pt-3 text-xs text-muted">
                  Last checked {formatDateTime(verification.lastCheckedAt)}
                  {verification.solvedAt ? ` · Solved ${formatDateTime(verification.solvedAt)}` : ""}
                </p>
              ) : null}
            </Card>

            <Card className="flex flex-col gap-4">
              <div>
                <h2 className="m-0 text-base font-semibold">Provisional Solve Check</h2>
                <p className="mt-1 mb-0 text-sm text-fg-2">
                  Checks public submissions for your linked handle against this problem. Provisional checks only inspect submission history and do not assert handle ownership.
                </p>
              </div>

              {problem.platform === "leetcode" ? (
                <Callout tone="warn" title="LeetCode check unavailable in v1">
                  LeetCode provisional solve checks return unavailable in this release and do not award progress.
                </Callout>
              ) : !currentUser?.handles?.codeforces ? (
                <Callout tone="info" title="Codeforces handle required">
                  Link your Codeforces handle on your{" "}
                  <Link href="/profile" className="font-semibold text-primary">
                    profile
                  </Link>{" "}
                  before running a provisional solve check.
                </Callout>
              ) : null}

              {checkResult?.result === "solved" ? (
                <Callout tone="ok" title="Submission matched">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 aria-hidden="true" size={15} />
                    Accepted submission found. Problem marked solved.
                  </span>
                </Callout>
              ) : null}

              {checkResult?.result === "failed" ? (
                <Callout tone="danger" role="alert" title="No accepted submission found">
                  No accepted submission was found for handle{" "}
                  <code className="font-mono">{currentUser?.handles?.codeforces}</code>. Submit on Codeforces and try again.
                </Callout>
              ) : null}

              {checkResult?.result === "unlinked" || checkResult?.result === "unavailable" ? (
                <Callout tone="warn" role="alert">
                  {checkResult.message}
                </Callout>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={runCheck} loading={checking}>
                  <RefreshCw aria-hidden="true" size={15} />
                  Run solve check
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </PlatformShell>
  );
}
