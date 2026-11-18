"use client";

import { useState } from "react";
import { CheckCircle2, Download, Upload } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime } from "@/lib/status.js";

export default function AdminResultsPage() {
  const { store, fetchContestResults, publishContestResults } = usePlatform();
  const [selectedId, setSelectedId] = useState(
    () => store.contests.find((c) => c.resultsState !== "published")?.id ?? store.contests[0]?.id ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);

  const contest = store.contests.find((c) => c.id === selectedId) ?? store.contests[0] ?? null;
  const rows = contest ? (store.contestResults[contest.id] ?? []) : [];
  const teamRows = contest ? (store.teamContestResults[contest.id] ?? []) : [];

  function runFetch(simulateError = false) {
    if (!contest) return;
    setFetchError("");
    setLoading(true);
    window.setTimeout(() => {
      const res = fetchContestResults(contest.id, simulateError);
      setLoading(false);
      if (!res.ok) setFetchError(res.error);
    }, 350);
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Contest Results" }]}
    >
      <PageHeader
        title="Contest Results Pipeline"
        description="Fetch Codeforces standings, inspect matched handles and unmatched participants, then publish final standings."
      />

      <Card className="flex flex-wrap items-end justify-between gap-4">
        <label className="flex min-w-[min(320px,100%)] flex-1 flex-col gap-1.5 text-[13px] font-semibold">
          <span>Select contest</span>
          <select
            value={contest?.id ?? ""}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setFetchError("");
            }}
            className="h-10 rounded-[2px] border border-border-strong bg-surface px-3 font-mono text-[13px] text-fg"
          >
            {store.contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.mode} · {c.resultsState.replace("_", " ")})
              </option>
            ))}
          </select>
        </label>

        {contest ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => runFetch(false)}
              loading={loading}
              disabled={contest.resultsState === "published"}
              variant="outline"
            >
              <Download aria-hidden="true" size={15} />
              Fetch standings
            </Button>
            {contest.resultsState !== "published" ? (
              <Button size="sm" variant="ghost" disabled={loading} onClick={() => runFetch(true)}>
                Simulate fetch error
              </Button>
            ) : null}
            <Button
              onClick={() => setConfirmPublish(true)}
              disabled={contest.resultsState !== "fetched"}
            >
              <Upload aria-hidden="true" size={15} />
              Publish results
            </Button>
          </div>
        ) : null}
      </Card>

      {fetchError ? (
        <Callout tone="danger" role="alert" title="Codeforces fetch failed">
          {fetchError}
        </Callout>
      ) : null}

      {contest ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Results State"
              value={contest.resultsState.replace("_", " ")}
              hint={contest.lastFetchedAt ? `Fetched ${formatDateTime(contest.lastFetchedAt)}` : "Not yet fetched"}
            />
            <Stat
              label="Matched Participants"
              value={contest.fetchSummary ? `${contest.fetchSummary.matched} / ${contest.fetchSummary.processed}` : "—"}
              hint={contest.mode === "team" && contest.fetchSummary?.teamsMatched ? `${contest.fetchSummary.teamsMatched} teams ranked` : "Codeforces handle match"}
            />
            <Stat
              label="Unmatched Handles"
              value={contest.fetchSummary ? contest.fetchSummary.unmatchedHandles.length : "—"}
              hint={
                contest.fetchSummary?.unmatchedHandles?.length
                  ? contest.fetchSummary.unmatchedHandles.slice(0, 3).join(", ")
                  : "None"
              }
            />
          </section>

          {contest.resultsState === "published" ? (
            <Callout tone="ok" title="Standings published">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" size={15} />
                Final standings for {contest.title} are live for students and locked from overwrite.
              </span>
            </Callout>
          ) : null}

          {contest.mode === "team" && teamRows.length > 0 ? (
            <ResponsiveTable
              caption="Derived team standings"
              rows={teamRows}
              rowKey={(r) => r.teamId}
              columns={[
                { key: "rank", header: "Rank", align: "right", render: (r) => <strong className="font-mono">#{r.rank}</strong> },
                { key: "team", header: "Team", render: (r) => <span className="font-semibold">{r.teamName}</span> },
                {
                  key: "matched",
                  header: "Matched Members",
                  align: "right",
                  render: (r) => (
                    <span className="font-mono tabular-nums">
                      {r.matchedMembers} / {r.memberCount}
                    </span>
                  ),
                },
                { key: "points", header: "Points", align: "right", render: (r) => <strong className="font-mono tabular-nums">{r.points}</strong> },
                { key: "penalty", header: "Penalty", align: "right", render: (r) => <span className="font-mono tabular-nums">{r.penalty}</span> },
              ]}
            />
          ) : null}

          <ResponsiveTable
            caption="Matched participant rows"
            rows={rows}
            rowKey={(r) => `${r.userId}-${r.rank}`}
            empty="Fetch standings from Codeforces to preview matched rows."
            columns={[
              { key: "rank", header: "Rank", align: "right", render: (r) => <strong className="font-mono">#{r.rank}</strong> },
              { key: "name", header: "Student", render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: "handle", header: "Codeforces Handle", render: (r) => <code className="font-mono text-xs">{r.handle}</code> },
              { key: "points", header: "Points", align: "right", render: (r) => <strong className="font-mono tabular-nums">{r.points}</strong> },
              { key: "penalty", header: "Penalty", align: "right", render: (r) => <span className="font-mono tabular-nums">{r.penalty}</span> },
              { key: "status", header: "Match", render: () => <Badge tone="success">matched</Badge> },
            ]}
          />

          <Modal
            open={confirmPublish}
            onClose={() => setConfirmPublish(false)}
            title={`Publish results for ${contest.title}?`}
            description="Once published, results are visible to all students and locked from overwrite."
            footer={
              <>
                <Button variant="outline" onClick={() => setConfirmPublish(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    publishContestResults(contest.id);
                    setConfirmPublish(false);
                  }}
                >
                  Confirm publish
                </Button>
              </>
            }
          />
        </>
      ) : null}
    </PlatformShell>
  );
}
