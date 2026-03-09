'use client';

import Link from 'next/link';
import { useCourseDetail } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, ArrowLeft } from 'lucide-react';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { course, loading, error } = useCourseDetail(params.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-4">
        <Link href="/courses">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            Back to Courses
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Course not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/courses">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          Back to Courses
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10" />
          {course.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">{course.description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{course.enrolledCount || 0}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {typeof course.instructor === 'string'
                ? 'Loading...'
                : course.instructor
                ? `${course.instructor.firstName} ${course.instructor.lastName}`
                : 'Not assigned'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-semibold">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Details about this course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-slate-700 dark:text-slate-300">{course.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Created</h3>
            <p className="text-slate-700 dark:text-slate-300">
              {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          {course.participants && Array.isArray(course.participants) && course.participants.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recent Participants</h3>
              <div className="space-y-2">
                {course.participants.slice(0, 5).map((participant: any, idx: number) => (
                  <div key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                    {typeof participant === 'string' ? participant : `${participant.firstName} ${participant.lastName}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
