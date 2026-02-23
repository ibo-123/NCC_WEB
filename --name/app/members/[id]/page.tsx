// app/members/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UI/UserAvatar";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface Member {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  role: string;
  status: string;
  activeness: number;
  profileImage?: string;
  bio?: string;
  nccUnit?: string;
  nccRank?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id as string;
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId]);

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/users/${memberId}`);
      if (response.ok) {
        const data = await response.json();
        setMember(data.user);
      } else {
        setError("Member not found");
      }
    } catch (error) {
      console.error("Error fetching member:", error);
      setError("Failed to load member profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="flex items-center gap-6 mb-8">
                <div className="h-24 w-24 bg-muted rounded-full"></div>
                <div>
                  <div className="h-8 bg-muted rounded w-64 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg">
                  <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-4 bg-muted rounded w-full"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="bg-card p-6 rounded-lg">
                  <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-4 bg-muted rounded w-full"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !member) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Member Not Found
            </h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link
              href="/members"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Members
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-6">
              <UserAvatar
                name={member.name}
                profileImage={member.profileImage}
                size="lg"
                className="w-24 h-24"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {member.name}
                </h1>
                <p className="text-lg text-muted-foreground capitalize">
                  {member.role}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : member.status === "Inactive"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {member.status}
                  </span>
                  {member.nccRank && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                      {member.nccRank}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bio */}
          {member.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card p-6 rounded-lg border border-border mb-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-3">
                About
              </h2>
              <p className="text-muted-foreground">{member.bio}</p>
            </motion.div>
          )}

          {/* Activity Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-lg border border-border mb-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Activity Level
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-muted rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full transition-all duration-500"
                  style={{ width: `${member.activeness}%` }}
                ></div>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {member.activeness}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on participation in events, courses, and club activities
            </p>
          </motion.div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card p-6 rounded-lg border border-border"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Academic Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Student ID
                  </label>
                  <p className="text-foreground">{member.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Department
                  </label>
                  <p className="text-foreground">{member.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Year
                  </label>
                  <p className="text-foreground">{member.year}</p>
                </div>
                {member.nccUnit && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      NCC Unit
                    </label>
                    <p className="text-foreground">{member.nccUnit}</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-6 rounded-lg border border-border"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Contact Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-foreground">{member.email}</p>
                </div>
                {member.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="text-foreground">{member.phone}</p>
                  </div>
                )}
                {member.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p className="text-foreground">{member.address}</p>
                  </div>
                )}
                {member.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <p className="text-foreground">
                      {new Date(member.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card p-6 rounded-lg border border-border"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Member Since
                </label>
                <p className="text-foreground">
                  {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
              {member.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Login
                  </label>
                  <p className="text-foreground">
                    {new Date(member.lastLogin).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <Link
              href="/members"
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              ← Back to Members
            </Link>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
