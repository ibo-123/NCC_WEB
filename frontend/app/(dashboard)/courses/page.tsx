"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Users } from "lucide-react";
import { apiClient } from "@/lib/api";
// import { useAuth } from "@/lib/auth"; // Assuming you have an auth hook

// Temporary mock useAuth hook for demonstration; replace with your actual auth logic
function useAuth() {
  // Replace this with your real authentication logic
  return { user: null };
}

// Types
interface Course {
  _id: string;
  title: string;
  description: string;
  enrolledCount: number;
  instructor?: {
    name: string;
    _id: string;
  };
  category?: string;
  level?: string;
  duration?: string;
}

interface EnrollResponse {
  message: string;
  enrollment: {
    _id: string;
    courseId: string;
    userId: string;
    status: string;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { user } = useAuth(); // Get current user

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Course[] | { courses: Course[] }>(
        "/courses",
      );
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data && Array.isArray((data as any).courses)) {
        setCourses((data as { courses: Course[] }).courses);
      } else {
        setCourses([]);
      }
      setMessage(null);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load courses",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      setMessage({
        type: "error",
        text: "Please log in to enroll in courses",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setEnrollingId(courseId);
    setMessage(null);

    try {
      const data = await apiClient.post<EnrollResponse>(
        `/courses/${courseId}/enroll`,
      );

      if (!data || !(data as any).message) {
        throw new Error("Failed to enroll");
      }

      // Update the enrolled count for the course
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? { ...course, enrolledCount: course.enrolledCount + 1 }
            : course,
        ),
      );

      setMessage({
        type: "success",
        text: data.message || "Successfully enrolled in course!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to enroll",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setEnrollingId(null);
    }
  };

  const checkEnrollmentStatus = async (courseId: string) => {
    if (!user) return false;

    try {
      const response = await fetch(
        `/api/enrollments/check?courseId=${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.isEnrolled;
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
    return false;
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
          Browse and enroll in available programming courses
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
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
              {searchTerm
                ? "No courses match your search"
                : "No courses available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users size={16} />
                    <span>{course.enrolledCount || 0} enrolled</span>
                  </div>
                  {course.level && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Level: {course.level}
                    </div>
                  )}
                  {course.duration && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Duration: {course.duration}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Link href={`/courses/${course._id}`} className="block">
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrollingId === course._id}
                    className="w-full"
                  >
                    {enrollingId === course._id ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
