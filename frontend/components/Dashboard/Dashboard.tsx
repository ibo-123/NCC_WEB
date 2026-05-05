"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminDashboard,
  getDashboardStats,
  getUserStats,
} from "@/lib/dashboardService";
import type {
  AdminDashboardStats,
  DashboardStats,
  UserDashboardStats,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import UserProfileCard from "./UserProfileCard";
import StatsCards from "./StatsCards";
import AchievementsList from "./AchievementsList";
import RecentEvents from "./RecentEvents";
import UpcomingEvents from "./UpcomingEvents";
import ChartsSection from "./ChartsSection";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [userStats, setUserStats] = useState<UserDashboardStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const fetchDashboardData = async () => {
    setError(null);
    setLoading(true);

    try {
      const [statsResponse, userStatsResponse] = await Promise.all([
        getDashboardStats(),
        getUserStats(),
      ]);

      setDashboardStats(statsResponse.data);
      setUserStats(userStatsResponse.data);

      if (isAdmin) {
        const adminResponse = await getAdminDashboard();
        setAdminStats(adminResponse.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }

    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, isAdmin]);

  const pageTitle = useMemo(
    () => userStats?.profile?.name || `${user?.firstName ?? "Member"}`,
    [user, userStats],
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-slate-700 dark:text-slate-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {pageTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Your dashboard shows attendance trends, recent achievements,
            upcoming events, and admin insights when you need them.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRefreshing(true);
            fetchDashboardData();
          }}
          className="w-full md:w-auto"
          disabled={refreshing}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load dashboard</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <UserProfileCard profile={userStats?.profile ?? null} />
          <StatsCards
            attendancePercentage={userStats?.attendancePercentage ?? 0}
            totalEvents={userStats?.totalEvents ?? 0}
            attendedEvents={userStats?.attendedEvents ?? 0}
          />
          <ChartsSection
            monthlyAttendance={userStats?.monthlyAttendance ?? []}
            achievementsByCategory={userStats?.achievementsByCategory ?? []}
            attendanceByType={userStats?.attendanceByType ?? []}
          />
        </div>

        <div className="space-y-6">
          <AchievementsList achievements={userStats?.achievements ?? []} />
          <RecentEvents events={userStats?.recentEvents ?? []} />
          <UpcomingEvents events={userStats?.upcomingEvents ?? []} />
        </div>
      </div>

      {isAdmin ? (
        <AdminDashboard stats={dashboardStats} adminData={adminStats} />
      ) : null}
    </div>
  );
}
