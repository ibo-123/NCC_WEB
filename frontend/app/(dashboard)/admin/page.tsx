'use client';

import { useAuth } from '@/lib/auth-context';
import { useDashboardStats, useUsers, useCourses, useEvents, useAchievements } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, Users, BookOpen, Calendar, Award } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { stats } = useDashboardStats();
  const { users } = useUsers();
  const { courses } = useCourses();
  const { events } = useEvents();
  const { achievements } = useAchievements();

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg font-semibold">
          You don't have permission to access this page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage users, courses, events, and achievements
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
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
            <div className="text-2xl font-bold">{courses.length}</div>
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
            <div className="text-2xl font-bold">{events.length}</div>
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
            <div className="text-2xl font-bold">{achievements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              All Systems
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage NCC members and staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <span className="font-medium">Total Users:</span> {users.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Admins:</span> {users.filter((u) => u.role === 'admin').length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Instructors:</span> {users.filter((u) => u.role === 'instructor').length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Cadets:</span> {users.filter((u) => u.role === 'user').length}
              </div>
            </div>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Management
            </CardTitle>
            <CardDescription>Create and manage courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <span className="font-medium">Total Courses:</span> {courses.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Enrollments:</span>{' '}
                {courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)}
              </div>
            </div>
            <Link href="/admin/courses">
              <Button className="w-full">Manage Courses</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Management
            </CardTitle>
            <CardDescription>Organize and monitor events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <span className="font-medium">Total Events:</span> {events.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Registrations:</span>{' '}
                {events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)}
              </div>
            </div>
            <Link href="/admin/events">
              <Button className="w-full">Manage Events</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievement Management
            </CardTitle>
            <CardDescription>Create and award achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <span className="font-medium">Total Achievements:</span> {achievements.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Awards:</span>{' '}
                {achievements.reduce((sum, a) => sum + (Array.isArray(a.awardedTo) ? a.awardedTo.length : 0), 0)}
              </div>
            </div>
            <Link href="/admin/achievements">
              <Button className="w-full">Manage Achievements</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
