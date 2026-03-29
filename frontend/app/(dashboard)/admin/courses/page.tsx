"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCourses } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, ArrowLeft, Users } from "lucide-react";

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const { courses, loading } = useCourses();
  const [searchTerm, setSearchTerm] = useState("");

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg font-semibold">
          You don't have permission to access this page
        </p>
      </div>
    );
  }

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

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Link href="/admin">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          Back to Admin
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Course Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Create, edit, and manage training courses
        </p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Link href="/admin/courses/create">
          <Button>Create Course</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {filteredCourses.map((course) => (
          <Card key={course._id || course.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{course.title}</span>
                <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full flex items-center gap-1">
                  <Users size={14} />
                  {course.enrolledCount || 0}
                </span>
              </CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Instructor
                  </p>
                  <p className="text-sm mt-1">
                    {typeof course.instructor === "string"
                      ? course.instructor
                      : course.instructor
                        ? `${course.instructor.firstName} ${course.instructor.lastName}`
                        : "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Enrolled
                  </p>
                  <p className="text-sm mt-1">
                    {course.enrolledCount || 0} participants
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Created
                  </p>
                  <p className="text-sm mt-1">
                    {course.createdAt
                      ? new Date(course.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  View Participants
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm
                ? "No courses match your search"
                : "No courses created yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
