// app/president/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UI/UserAvatar";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface President {
  _id: string;
  name: string;
  profileImage?: string;
  bio: string;
  achievements: string[];
  vision: string;
  contact: {
    email: string;
    linkedin?: string;
    github?: string;
  };
  tenure: string;
}

export default function PresidentPage() {
  const [president, setPresident] = useState<President | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresident();
  }, []);

  const fetchPresident = async () => {
    try {
      // Mock data - in real implementation, this would come from backend
      const mockPresident: President = {
        _id: "president-1",
        name: "Dr. Sarah Chen",
        bio: "Dr. Sarah Chen is a distinguished computer scientist with over 15 years of experience in academia and industry. She holds a Ph.D. in Computer Science from MIT and has published numerous papers in top-tier conferences. As the President of NCC MSJ, she is passionate about fostering the next generation of competitive programmers and software engineers.",
        achievements: [
          "Ph.D. in Computer Science from MIT",
          "Published 50+ papers in top conferences",
          "Former Google Senior Engineer",
          "ACM Distinguished Speaker",
          "Led team to ICPC World Finals",
        ],
        vision:
          "To create a vibrant community where students can excel in competitive programming, develop cutting-edge software solutions, and build lifelong connections with peers and industry leaders. Our goal is to bridge the gap between academic learning and real-world application.",
        contact: {
          email: "president@ncc-msj.edu",
          linkedin: "https://linkedin.com/in/sarahchen",
          github: "https://github.com/sarahchen",
        },
        tenure: "2024-2025",
      };
      setPresident(mockPresident);
    } catch (error) {
      console.error("Error fetching president data:", error);
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
              <div className="flex items-center gap-8 mb-8">
                <div className="h-32 w-32 bg-muted rounded-full"></div>
                <div>
                  <div className="h-8 bg-muted rounded w-64 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!president) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              President Information Unavailable
            </h1>
            <p className="text-muted-foreground">
              Unable to load president information at this time.
            </p>
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
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Club President
            </h1>
            <p className="text-lg text-muted-foreground">
              Leading NCC MSJ into the future
            </p>
          </motion.div>

          {/* President Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-8 rounded-lg border border-border mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <UserAvatar
                name={president.name}
                profileImage={president.profileImage}
                size="lg"
                className="w-32 h-32"
              />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {president.name}
                </h2>
                <p className="text-lg text-primary font-medium mb-4">
                  President • {president.tenure}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {president.bio}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-lg border border-border mb-8"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Vision for NCC MSJ
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {president.vision}
            </p>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-6 rounded-lg border border-border mb-8"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Key Achievements
            </h3>
            <ul className="space-y-3">
              {president.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">{achievement}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card p-6 rounded-lg border border-border"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href={`mailto:${president.contact.email}`}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <span className="text-xl">📧</span>
                <div>
                  <div className="font-medium text-foreground">Email</div>
                  <div className="text-sm text-muted-foreground">
                    {president.contact.email}
                  </div>
                </div>
              </a>
              {president.contact.linkedin && (
                <a
                  href={president.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <span className="text-xl">💼</span>
                  <div>
                    <div className="font-medium text-foreground">LinkedIn</div>
                    <div className="text-sm text-muted-foreground">
                      Connect professionally
                    </div>
                  </div>
                </a>
              )}
              {president.contact.github && (
                <a
                  href={president.contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <span className="text-xl">💻</span>
                  <div>
                    <div className="font-medium text-foreground">GitHub</div>
                    <div className="text-sm text-muted-foreground">
                      View projects
                    </div>
                  </div>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
