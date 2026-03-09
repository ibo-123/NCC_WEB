'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCourses } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Users } from 'lucide-react';

export default function CoursesPage() {
  const { courses, loading, enrollCourse } = useCourses();
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    setMessage('');

    try {
      await enrollCourse(courseId);
      setMessage('Successfully enrolled in course!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Courses
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Browse and enroll in available training courses
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.includes('Successfully')
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm ? 'No courses match your search' : 'No courses available yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id || course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <Users size={16} />
                  <span>{course.enrolledCount || 0} enrolled</span>
                </div>
                <Link href={`/courses/${course._id || course.id}`} className="block">
                  <Button className="w-full mb-2" variant="outline">
                    View Details
                  </Button>
                </Link>
                <Button
                  onClick={() => handleEnroll(course._id || course.id || '')}
                  disabled={enrollingId === (course._id || course.id)}
                  className="w-full"
                >
                  {enrollingId === (course._id || course.id) ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
