import type { AdminDashboardStats, DashboardStats } from "@/lib/types";
import { Users, Calendar, Award, BookOpen } from "lucide-react";

import type { ReactNode } from "react";

interface AdminDashboardProps {
  stats: DashboardStats | null;
  adminData: AdminDashboardStats | null;
}

export default function AdminDashboard({
  stats,
  adminData,
}: AdminDashboardProps) {
  if (!adminData) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Admin insights will appear once the admin dashboard data loads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Admin Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            System overview
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            High-level system metrics and recent activity for administrative
            users.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <AdminStatCard
            icon={<Users className="h-4 w-4" />}
            label="Users"
            value={adminData.totalUsers ?? stats?.totalUsers ?? 0}
          />
          <AdminStatCard
            icon={<Calendar className="h-4 w-4" />}
            label="Events"
            value={adminData.totalEvents ?? stats?.totalEvents ?? 0}
          />
          <AdminStatCard
            icon={<Award className="h-4 w-4" />}
            label="Achievements"
            value={adminData.totalAchievements ?? stats?.totalAchievements ?? 0}
          />
          <AdminStatCard
            icon={<BookOpen className="h-4 w-4" />}
            label="Courses"
            value={adminData.totalCourses ?? stats?.totalCourses ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ActivityList
          title="Recent Users"
          items={adminData.recentUsers.map((item) => ({
            label: item.name,
            description: item.email,
            meta: item.joinedDate,
          }))}
        />

        <ActivityList
          title="Recent Events"
          items={adminData.recentEvents.map((item) => ({
            label: item.title,
            description: item.status,
            meta: item.date,
          }))}
        />

        <ActivityList
          title="Recent Achievements"
          items={adminData.recentAchievements.map((item) => ({
            label: item.userName,
            description: item.achievementTitle,
            meta: "Achievement awarded",
          }))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User Growth" description="New users each month">
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {adminData.userGrowth.map((growth) => (
                  <tr key={`${growth.month}-${growth.value}`}>
                    <td className="px-3 py-3">{growth.month}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">
                      {growth.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard
          title="Attendance Overview"
          description="Attendance distribution by type"
        >
          <div className="mt-4 space-y-3">
            {adminData.attendanceOverview.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.value} records
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function AdminStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ActivityList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; description: string; meta: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="mt-5 space-y-4">
        {items.slice(0, 5).map((item) => (
          <div
            key={`${item.label}-${item.meta}`}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold text-slate-900 dark:text-white">
              {item.label}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {item.description}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {item.meta}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
      {children}
    </div>
  );
}
