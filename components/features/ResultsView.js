"use client";

import { useMemo, useState } from "react";
import { Award } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { Button } from "@/components/ui/Button.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate } from "@/lib/status.js";

const MODE_TABS = [
  { id: "individual", label: "Individual" },
  { id: "team", label: "Group" },
];

const PAGE_SIZE = 10;

export function ResultsView({ initialMode = "individual", contestIdProp = null }) {
  const { store, currentUser, currentTeam } = usePlatform();

  const initialContest = contestIdProp
    ? store.contests.find((c) => c.id === contestIdProp)
    : null;

  const [mode, setMode] = useState(initialContest?.mode ?? initialMode);
  const [selectedContestId, setSelectedContestId] = useState(contestIdProp ?? "");
  const [teamView, setTeamView] = useState("standings"); // "standings" | "members"
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const publishedContestsForMode = useMemo(
    () =>
      store.contests.filter(
        (c) => c.publication === "published" && c.resultsState === "published" && c.mode === mode,
      ),
    [store.contests, mode],
  );

  // Per B20: default to latest published contest when none specified
  const activeContest =
    publishedContestsForMode.find((c) => c.id === selectedContestId) ??
    publishedContestsForMode[0] ??
    null;

  const individualRows = useMemo(
    () => (activeContest ? (store.contestResults[activeContest.id] ?? []) : []),
    [activeContest, store.contestResults],
  );
  const teamRows = useMemo(
    () => (activeContest ? (store.teamContestResults[activeContest.id] ?? []) : []),
    [activeContest, store.teamContestResults],
  );

  const myRow =
    activeContest && currentUser
      ? mode === "team"
        ? teamRows.find((r) => currentTeam && r.teamId === currentTeam.id)
        : individualRows.find((r) => r.userId === currentUser.id)
      : null;

  const activeRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (mode === "team" && teamView === "standings") {
      return teamRows.filter((r) => !q || r.teamName.toLowerCase().includes(q));
    }
    return individualRows.filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.handle.toLowerCase().includes(q),
    );
  }, [mode, teamView, teamRows, individualRows, query]);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = activeRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: mode === "team" ? "Team results" : "Results" },
        ...(contestIdProp && activeContest ? [{ label: activeContest.title }] : []),
      ]}
    >
      <PageHeader
        title={mode === "team" ? "Team Contest Results" : "Contest Results"}
        description="Published Codeforces standings for a single contest. No cross-contest leaderboard is aggregated."
        actions={
          !contestIdProp ? (
            <Tabs
              items={MODE_TABS}
              activeId={mode}
              onChange={(nextMode) => {
                setMode(nextMode);
                setSelectedContestId("");
                setTeamView("standings");
                setQuery("");
                setPage(1);
              }}
              ariaLabel="Results mode"
            />
          ) : null
        }
      />

      {!activeContest ? (
        <EmptyState
          icon={Award}
          title={`No published ${mode === "team" ? "team" : "individual"} results yet`}
          description="Results appear here once an administrator fetches and publishes standings for a completed contest."
        />
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                Selected Contest
              </span>
              <h2 className="m-0 mt-1 text-lg font-semibold">{activeContest.title}</h2>
              <p className="m-0 mt-0.5 text-xs text-muted">
                Held {formatShortDate(activeContest.startsAt)} · Codeforces #{activeContest.platformContestId}
              </p>
            </div>
            {publishedContestsForMode.length > 1 ? (
              <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
                <span>Switch contest</span>
                <select
                  value={activeContest.id}
                  onChange={(e) => {
                    setSelectedContestId(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm text-fg"
                >
                  {publishedContestsForMode.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </Card>

          <section className="grid gap-4 sm:grid-cols-3">
            <Stat
              label={mode === "team" ? "Your Team Rank" : "Your Rank"}
              value={myRow ? `#${myRow.rank}` : "—"}
              hint={myRow ? (mode === "team" ? myRow.teamName : myRow.handle) : "No matched standing"}
            />
            <Stat
              label={mode === "team" ? "Team Points" : "Your Points"}
              value={myRow ? myRow.points : "—"}
              hint={myRow ? `Penalty ${myRow.penalty}` : "—"}
            />
            <Stat
              label={mode === "team" ? "Teams Ranked" : "Participants Ranked"}
              value={mode === "team" ? teamRows.length : individualRows.length}
              hint="Published Codeforces rows"
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={query}
              onChange={(val) => {
                setQuery(val);
                setPage(1);
              }}
              placeholder={
                mode === "team" && teamView === "standings"
                  ? "Search team name..."
                  : "Search participant or handle..."
              }
              label="Search standings"
            />
            {mode === "team" ? (
              <Tabs
                items={[
                  { id: "standings", label: "Team standings", count: teamRows.length },
                  { id: "members", label: "Member source rows", count: individualRows.length },
                ]}
                activeId={teamView}
                onChange={(v) => {
                  setTeamView(v);
                  setPage(1);
                }}
                ariaLabel="Team results table view"
              />
            ) : null}
          </div>

          {mode === "team" && teamView === "standings" ? (
            <ResponsiveTable
              caption={`${activeContest.title} team standings`}
              rows={pageRows}
              rowKey={(row) => row.teamId}
              highlight={(row) => Boolean(currentTeam && row.teamId === currentTeam.id)}
              empty="No teams match your search."
              columns={[
                {
                  key: "rank",
                  header: "Rank",
                  align: "right",
                  render: (row) => <strong className="font-mono tabular-nums">#{row.rank}</strong>,
                },
                {
                  key: "teamName",
                  header: "Team",
                  render: (row) => (
                    <span className="inline-flex items-center gap-2 font-semibold text-fg">
                      {row.teamName}
                      {currentTeam && row.teamId === currentTeam.id ? <Badge tone="info">Your team</Badge> : null}
                    </span>
                  ),
                },
                {
                  key: "matched",
                  header: "Members Matched",
                  align: "right",
                  render: (row) => (
                    <span className="font-mono text-fg-2 tabular-nums">
                      {row.matchedMembers} / {row.memberCount}
                    </span>
                  ),
                },
                {
                  key: "points",
                  header: "Points",
                  align: "right",
                  render: (row) => <strong className="font-mono tabular-nums">{row.points}</strong>,
                },
                {
                  key: "penalty",
                  header: "Penalty",
                  align: "right",
                  render: (row) => <span className="font-mono text-fg-2 tabular-nums">{row.penalty}</span>,
                },
              ]}
            />
          ) : (
            <ResponsiveTable
              caption={`${activeContest.title} standings`}
              rows={pageRows}
              rowKey={(row) => `${row.userId}-${row.rank}`}
              highlight={(row) => Boolean(currentUser && row.userId === currentUser.id)}
              empty="No participants match your search."
              columns={[
                {
                  key: "rank",
                  header: "Rank",
                  align: "right",
                  render: (row) => <strong className="font-mono tabular-nums">#{row.rank}</strong>,
                },
                {
                  key: "name",
                  header: "Student",
                  render: (row) => (
                    <span className="inline-flex items-center gap-2 font-semibold text-fg">
                      {row.name}
                      {currentUser && row.userId === currentUser.id ? <Badge tone="info">You</Badge> : null}
                    </span>
                  ),
                },
                {
                  key: "handle",
                  header: "Codeforces Handle",
                  render: (row) => <code className="font-mono text-xs text-fg-2">{row.handle}</code>,
                },
                {
                  key: "points",
                  header: "Points",
                  align: "right",
                  render: (row) => <strong className="font-mono tabular-nums">{row.points}</strong>,
                },
                {
                  key: "penalty",
                  header: "Penalty",
                  align: "right",
                  render: (row) => <span className="font-mono text-fg-2 tabular-nums">{row.penalty}</span>,
                },
              ]}
            />
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 text-sm">
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
        </>
      )}
    </PlatformShell>
  );
}
