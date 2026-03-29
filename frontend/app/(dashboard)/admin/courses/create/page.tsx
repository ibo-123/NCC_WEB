"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";

interface Material {
  title: string;
  type: "pdf" | "ppt" | "doc" | "link" | "other";
  url: string;
  description: string;
}

export default function CreateCoursePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    videoType: "youtube",
    videoUrl: "",
    videoFile: "",
    duration: "",
    tags: "",
  });
  const [materials, setMaterials] = useState<Material[]>([]);

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg font-semibold">
          You don't have permission to access this page
        </p>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { title: "", type: "pdf", url: "", description: "" },
    ]);
  };

  const updateMaterial = (
    index: number,
    field: keyof Material,
    value: string,
  ) => {
    setMaterials((prev) =>
      prev.map((material, i) =>
        i === index ? { ...material, [field]: value } : material,
      ),
    );
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const courseData = {
        ...formData,
        duration: parseInt(formData.duration) || 0,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        materials: materials.filter((m) => m.title && m.url),
      };

      const response = await apiClient.post("/courses", courseData);

      setMessage("Course created successfully!");
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        difficulty: "",
        videoType: "youtube",
        videoUrl: "",
        videoFile: "",
        duration: "",
        tags: "",
      });
      setMaterials([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create course";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/courses">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          Back to Course Management
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Create New Course
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Add a new programming course with video content and learning materials
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.includes("successfully")
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details of the course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Course Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Introduction to Algorithms"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what students will learn in this course"
                rows={4}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programming Fundamentals">
                      Programming Fundamentals
                    </SelectItem>
                    <SelectItem value="Data Structures">
                      Data Structures
                    </SelectItem>
                    <SelectItem value="Algorithms">Algorithms</SelectItem>
                    <SelectItem value="Web Development">
                      Web Development
                    </SelectItem>
                    <SelectItem value="Mobile Development">
                      Mobile Development
                    </SelectItem>
                    <SelectItem value="Machine Learning">
                      Machine Learning
                    </SelectItem>
                    <SelectItem value="Competitive Programming">
                      Competitive Programming
                    </SelectItem>
                    <SelectItem value="Software Engineering">
                      Software Engineering
                    </SelectItem>
                    <SelectItem value="Databases">Databases</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    handleInputChange("difficulty", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <Input
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="e.g., algorithms, sorting, competitive programming"
              />
              <p className="text-xs text-slate-500 mt-1">
                Separate tags with commas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Content</CardTitle>
            <CardDescription>Add video lecture for the course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Video Type
              </label>
              <Select
                value={formData.videoType}
                onValueChange={(value) => handleInputChange("videoType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube Video</SelectItem>
                  <SelectItem value="upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.videoType === "youtube" ? (
              <div>
                <label className="block text-sm font-medium mb-2">
                  YouTube URL
                </label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) =>
                    handleInputChange("videoUrl", e.target.value)
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video File URL
                </label>
                <Input
                  value={formData.videoFile}
                  onChange={(e) =>
                    handleInputChange("videoFile", e.target.value)
                  }
                  placeholder="URL to video file"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                placeholder="e.g., 60"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Learning Materials
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
              >
                <Plus size={16} className="mr-2" />
                Add Material
              </Button>
            </CardTitle>
            <CardDescription>
              Add PDFs, PPTs, documents, or external links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {materials.map((material, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Material {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterial(index)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <Input
                      value={material.title}
                      onChange={(e) =>
                        updateMaterial(index, "title", e.target.value)
                      }
                      placeholder="Material title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Type
                    </label>
                    <Select
                      value={material.type}
                      onValueChange={(value: any) =>
                        updateMaterial(index, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="ppt">PowerPoint</SelectItem>
                        <SelectItem value="doc">Document</SelectItem>
                        <SelectItem value="link">External Link</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <Input
                    value={material.url}
                    onChange={(e) =>
                      updateMaterial(index, "url", e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={material.description}
                    onChange={(e) =>
                      updateMaterial(index, "description", e.target.value)
                    }
                    placeholder="Brief description of the material"
                    rows={2}
                  />
                </div>
              </div>
            ))}

            {materials.length === 0 && (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                No materials added yet. Click "Add Material" to include learning
                resources.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Creating Course..." : "Create Course"}
          </Button>
          <Link href="/admin/courses">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
