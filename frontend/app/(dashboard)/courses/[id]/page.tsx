"use client";

import Link from "next/link";
import { use } from "react";
import { useCourseDetail } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Users, ArrowLeft } from "lucide-react";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { course, loading, error } = useCourseDetail(resolvedParams.id);

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
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || "Course not found"}
            </p>
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
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {course.description}
        </p>
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
            <div className="text-3xl font-bold">
              {course.enrolledCount || 0}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {typeof course.instructor === "string"
                ? "Loading..."
                : course.instructor
                  ? `${course.instructor.firstName} ${course.instructor.lastName}`
                  : "Not assigned"}
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
          <CardTitle>Course Content</CardTitle>
          <CardDescription>
            Video lecture and learning materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Section */}
          {course.videoType === "youtube" && course.videoUrl && (
            <div>
              <h3 className="font-semibold mb-3">Video Lecture</h3>
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${course.videoUrl.includes("v=") ? new URL(course.videoUrl).searchParams.get("v") : course.videoUrl.split("/").pop()}`}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={course.title}
                />
              </div>
            </div>
          )}

          {course.videoType === "upload" && course.videoFile && (
            <div>
              <h3 className="font-semibold mb-3">Video Lecture</h3>
              <video controls className="w-full rounded-lg max-h-[500px]">
                <source src={course.videoFile} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Materials Section */}
          {course.materials && course.materials.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Learning Materials</h3>
              <div className="space-y-3">
                {course.materials.map((material: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{material.title}</p>
                        {material.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {material.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(material.url, "_blank")}
                    >
                      {material.type === "link" ? "Open Link" : "Download"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!course.videoUrl &&
            (!course.materials || course.materials.length === 0) && (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                No course content available yet.
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
