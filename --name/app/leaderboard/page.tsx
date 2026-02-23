// app/leaderboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UI/UserAvatar";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  profileImage?: string;
  rating: number;
  solvedProblems: number;
  contestsParticipated: number;
  department: string;
  year: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all-time");

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      // Mock data for now - in real implementation, this would come from backend
      const mockData: LeaderboardEntry[] = [
        {
          rank: 1,
          userId: "1",
          name: "Alice Johnson",
          rating: 1850,
          solvedProblems: 245,
          contestsParticipated: 12,
          department: "Computer Science",
          year: "Third Year",
        },
        {
          rank: 2,
          userId: "2",
          name: "Bob Smith",
          rating: 1720,
          solvedProblems: 198,
          contestsParticipated: 15,
          department: "Information Technology",
          year: "Second Year",
        },
        {
          rank: 3,
          userId: "3",
          name: "Charlie Brown",
          rating: 1680,
          solvedProblems: 176,
          contestsParticipated: 10,
          department: "Computer Science",
          year: "Fourth Year",
        },
        {
          rank: 4,
          userId: "4",
          name: "Diana Prince",
          rating: 1620,
          solvedProblems: 152,
          contestsParticipated: 8,
          department: "Electronics",
          year: "Third Year",
        },
        {
          rank: 5,
          userId: "5",
          name: "Eve Wilson",
          rating: 1580,
          solvedProblems: 134,
          contestsParticipated: 11,
          department: "Computer Science",
          year: "Second Year",
        },
      ];
      setLeaderboard(mockData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return "text-red-600 dark:text-red-400";
    if (rating >= 1600) return "text-orange-600 dark:text-orange-400";
    if (rating >= 1400) return "text-yellow-600 dark:text-yellow-400";
    if (rating >= 1200) return "text-green-600 dark:text-green-400";
    return "text-blue-600 dark:text-blue-400";
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded w-1/3 mb-8"></div>
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-card p-6 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Competitive Programming Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Top performers in coding contests and problem-solving
            </p>
          </motion.div>

          {/* Timeframe Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex gap-2">
              {[
                { value: "all-time", label: "All Time" },
                { value: "monthly", label: "This Month" },
                { value: "weekly", label: "This Week" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-shadow ${
                  entry.rank <= 3 ? "ring-2 ring-primary/20" : ""
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {getRankIcon(entry.rank)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <UserAvatar
                      name={entry.name}
                      profileImage={entry.profileImage}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {entry.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.department} • {entry.year}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                      <div
                        className={`text-2xl font-bold ${getRatingColor(entry.rating)}`}
                      >
                        {entry.rating}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rating
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {entry.solvedProblems}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Problems
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {entry.contestsParticipated}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Contests
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-card p-6 rounded-lg border border-border"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">
              How Rankings Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Rating System
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Based on contest performance and problem difficulty</li>
                  <li>• Higher ratings for solving harder problems</li>
                  <li>• Consistent participation improves rating</li>
                  <li>
                    • Color-coded tiers: Blue → Green → Yellow → Orange → Red
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Activity Metrics
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Problems Solved: Total accepted submissions</li>
                  <li>• Contests Participated: Number of coding contests</li>
                  <li>• Regular practice and contest participation required</li>
                  <li>• Quality over quantity in problem selection</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
