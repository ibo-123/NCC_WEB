"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

export default function ContestDetailPage() {
  const { id } = useParams();
  const { store, currentUser, currentTeam } = usePlatform();

  const contest = store.contests.find((c) => c.id === id && c.publication === "published");
  const isTeam = contest?.mode === "team";

  const personalStanding =
    contest && !isTeam && currentUser
      ? (store.contestResults[contest.id] ?? []).find((r) => r.userId === currentUser.id)
      : null;

  const teamStanding =
    contest && isTeam && currentTeam
      ? (store.teamContestResults[contest.id] ?? []).find((r) => r.teamId === currentTeam.id)
      : null;

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: isTeam ? "Team contests" : "Contests", href: isTeam ? "/team-contests" : "/contests" },
        { label: contest?.title ?? "Contest" },
      ]}
    >
      {!contest ? (
        <EmptyState
          title="Contest not found"
          description="This contest does not exist or has not been published."
          action={<ButtonLink href="/contests">Back to contests</ButtonLink>}
        />
      ) : (
        <>
          <PageHeader
            title={contest.title}
            description={contest.description}
            actions={
              <>
                <ButtonLink href={isTeam ? "/team-contests" : "/contests"} variant="outline" size="sm">
                  <ArrowLeft aria-hidden="true" size={15} />
                  Back
                </ButtonLink>
                {contest.invitationUrl ? (
                  <a
                    href={contest.invitationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent bg-primary px-3 text-[13px] font-semibold text-primary-text no-underline hover:bg-primary-hover"
                  >
                    Open on Codeforces
                    <ExternalLink aria-hidden="true" size={14} />
                  </a>
                ) : null}
              </>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <Badge tone={statusToTone(contest.status)} dot={contest.status === "active"}>
                  {contest.status}
                </Badge>
                <Badge tone={isTeam ? "info" : "neutral"}>
                  {isTeam ? "Group (Team)" : "Individual"}
                </Badge>
              </div>

              <dl className="m-0 grid grid-cols-2 gap-4 text-sm max-[480px]:grid-cols-1">
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Platform</dt>
                  <dd className="m-0 mt-1 font-medium">Codeforces #{contest.platformContestId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Starts At</dt>
                  <dd className="m-0 mt-1 tabular-nums">{formatDateTime(contest.startsAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Duration</dt>
                  <dd className="m-0 mt-1 tabular-nums">
                    {contest.durationMinutes >= 1440
                      ? `${Math.round(contest.durationMinutes / 1440)} days (${contest.durationMinutes} min)`
                      : `${contest.durationMinutes} minutes`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Results</dt>
                  <dd className="m-0 mt-1 capitalize">{contest.resultsState.replace("_", " ")}</dd>
                </div>
              </dl>
            </Card>

            <Card className="flex flex-col justify-between gap-4">
              <div>
                <h2 className="m-0 text-base font-semibold">
                  {isTeam ? "Team Standing Preview" : "Personal Standing Preview"}
                </h2>
                {contest.resultsState !== "published" ? (
                  <p className="mt-2 mb-0 text-sm text-fg-2">
                    Standings have not been published yet. Compete using your linked Codeforces handle ({currentUser?.handles?.codeforces ?? "unlinked"}).
                  </p>
                ) : isTeam ? (
                  teamStanding ? (
                    <div className="mt-3 flex flex-col gap-1">
                      <div className="text-2xl font-semibold tabular-nums">
                        Rank #{teamStanding.rank} · {teamStanding.points} pts
                      </div>
                      <p className="m-0 text-sm text-fg-2">
                        {teamStanding.teamName} ({teamStanding.matchedMembers} / {teamStanding.memberCount} members matched)
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 mb-0 text-sm text-fg-2">No matched team standing recorded.</p>
                  )
                ) : personalStanding ? (
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="text-2xl font-semibold tabular-nums">
                      Rank #{personalStanding.rank} · {personalStanding.points} pts
                    </div>
                    <p className="m-0 text-sm text-fg-2">Penalty {personalStanding.penalty}</p>
                  </div>
                ) : (
                  <p className="mt-2 mb-0 text-sm text-fg-2">No matched individual standing recorded.</p>
                )}
              </div>

              {contest.resultsState === "published" ? (
                <div>
                  <ButtonLink href={`/results/${contest.id}`}>View full standings</ButtonLink>
                </div>
              ) : null}
            </Card>
          </div>
        </>
      )}
    </PlatformShell>
  );
}
