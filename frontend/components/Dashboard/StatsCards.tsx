import type { ReactNode } from "react";

interface StatsCardsProps {
  attendancePercentage: number;
  totalEvents: number;
  attendedEvents: number;
}

export default function StatsCards({
  attendancePercentage,
  totalEvents,
  attendedEvents,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Attendance Rate"
        value={`${attendancePercentage.toFixed(0)}%`}
      >
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{
              width: `${Math.min(Math.max(attendancePercentage, 0), 100)}%`,
            }}
          />
        </div>
      </StatCard>

      <StatCard title="Events Attended" value={String(attendedEvents)}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Events you marked attending
        </p>
      </StatCard>

      <StatCard title="Total Events" value={String(totalEvents)}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Events available this season
        </p>
      </StatCard>
    </div>
  );
}

function StatCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
      <div className="mt-4 text-sm">{children}</div>
    </div>
  );
}
