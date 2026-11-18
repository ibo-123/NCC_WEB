"use client";

import { useState } from "react";
import { Flame, Users } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Tabs } from "@/components/ui/Tabs.js";
import { ButtonLink } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

const STREAK_TABS = [
  { id: "individual", label: "Individual streak" },
  { id: "team", label: "Team streak" },
];

export function StreakView({ initialTab = "individual" }) {
  const { store, currentTeam } = usePlatform();
  const [tab, setTab] = useState(initialTab);

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: tab === "team" ? "Team streak" : "My streak" },
      ]}
    >
      <PageHeader
        title={tab === "team" ? "Team Activity Streak" : "My Activity Streak"}
        description="Daily qualifying problem solves, attendance sessions, and contest weeks over the past 18 weeks."
        actions={<Tabs items={STREAK_TABS} activeId={tab} onChange={setTab} ariaLabel="Streak mode" />}
      />

      {tab === "team" && !currentTeam ? (
        <EmptyState
          icon={Users}
          title="No active team"
          description="Join or create a team to start building a shared Group competition streak."
          action={<ButtonLink href="/teams">Go to My team</ButtonLink>}
        />
      ) : tab === "team" ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Current Team Streak"
              value={`${currentTeam.streak?.current ?? 0} days`}
              hint={currentTeam.name}
            />
            <Stat
              label="Longest Team Streak"
              value={`${currentTeam.streak?.longest ?? 0} days`}
              hint="Cohort best run"
            />
            <Stat
              label="Active Members"
              value={`${currentTeam.members.length} / ${currentTeam.maxMembers}`}
              hint="Shared qualifying days"
            />
          </section>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users aria-hidden="true" size={18} className="text-primary" />
              <h2 className="m-0 text-base font-semibold">{currentTeam.name} · 18-Week Activity</h2>
            </div>
            <ActivityHeatmap
              cells={store.heatmapTeam}
              caption="Filled cells indicate days where team members recorded qualifying team contest or practice activity."
            />
          </Card>
        </>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat label="Current Streak" value="14 days" hint="Qualifying daily activity" trend="up" />
            <Stat label="Longest Streak" value="21 days" hint="Personal cohort best" />
            <Stat label="Active Days (18w)" value={store.heatmapIndividual.filter((c) => c.count > 0).length} hint="Last 126 days" />
          </section>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Flame aria-hidden="true" size={18} className="text-warning" />
              <h2 className="m-0 text-base font-semibold">Individual Qualifying Activity</h2>
            </div>
            <ActivityHeatmap cells={store.heatmapIndividual} />
          </Card>
        </>
      )}
    </PlatformShell>
  );
}
