"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useDashboardStats, useCourses, useEvents } from "@/lib/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Award, Users } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { courses, loading: coursesLoading } = useCourses();
  const { events, loading: eventsLoading } = useEvents();

  const loading = statsLoading || coursesLoading || eventsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Here's what's happening in your competitive programming journey today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-600" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-red-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAchievements || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Recent Courses
            </CardTitle>
            <CardDescription>Latest courses available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(courses) &&
                courses.slice(0, 3).map((course) => (
                  <div
                    key={course._id || course.id}
                    className="text-sm p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  >
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {course.description}
                    </p>
                  </div>
                ))}
              {(!Array.isArray(courses) || courses.length === 0) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No courses yet
                </p>
              )}
            </div>
            <Link href="/courses" className="block mt-4">
              <Button variant="outline" className="w-full">
                View All Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Events coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(events) &&
                events.slice(0, 3).map((event) => (
                  <div
                    key={event._id || event.id}
                    className="text-sm p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {event.date}
                    </p>
                  </div>
                ))}
              {(!Array.isArray(events) || events.length === 0) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No events yet
                </p>
              )}
            </div>
            <Link href="/events" className="block mt-4">
              <Button variant="outline" className="w-full">
                View All Events
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/profile">
              <Button variant="outline" className="w-full justify-start">
                Edit Profile
              </Button>
            </Link>
            <Link href="/achievements">
              <Button variant="outline" className="w-full justify-start">
                View Achievements
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" className="w-full justify-start">
                Register for Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
