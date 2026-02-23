// app/vice-president/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UI/UserAvatar";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface VicePresident {
  _id: string;
  name: string;
  profileImage?: string;
  bio: string;
  responsibilities: string[];
  focus: string;
  contact: {
    email: string;
    linkedin?: string;
    github?: string;
  };
  tenure: string;
}

export default function VicePresidentPage() {
  const [vicePresident, setVicePresident] = useState<VicePresident | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVicePresident();
  }, []);

  const fetchVicePresident = async () => {
    try {
      // Mock data - in real implementation, this would come from backend
      const mockVicePresident: VicePresident = {
        _id: "vp-1",
        name: "Prof. Michael Rodriguez",
        bio: "Prof. Michael Rodriguez is an Associate Professor of Computer Science with a passion for competitive programming and algorithm design. He has been coaching students for ICPC competitions for 8 years and specializes in advanced data structures and optimization techniques.",
        responsibilities: [
          "Oversee competitive programming activities",
          "Coordinate with faculty for curriculum integration",
          "Manage contest organization and logistics",
          "Mentor advanced programming students",
          "Handle industry partnerships for internships",
        ],
        focus:
          "Building a strong competitive programming culture within the institution while ensuring academic excellence. Focus areas include algorithm competitions, coding bootcamps, and industry-relevant skill development.",
        contact: {
          email: "vice-president@ncc-msj.edu",
          linkedin: "https://linkedin.com/in/mrodriguez",
          github: "https://github.com/mrodriguez",
        },
        tenure: "2024-2025",
      };
      setVicePresident(mockVicePresident);
    } catch (error) {
      console.error("Error fetching vice president data:", error);
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

  if (!vicePresident) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Vice President Information Unavailable
            </h1>
            <p className="text-muted-foreground">
              Unable to load vice president information at this time.
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
              Vice President
            </h1>
            <p className="text-lg text-muted-foreground">
              Supporting excellence in competitive programming
            </p>
          </motion.div>

          {/* Vice President Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-8 rounded-lg border border-border mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <UserAvatar
                name={vicePresident.name}
                profileImage={vicePresident.profileImage}
                size="lg"
                className="w-32 h-32"
              />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {vicePresident.name}
                </h2>
                <p className="text-lg text-primary font-medium mb-4">
                  Vice President • {vicePresident.tenure}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {vicePresident.bio}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Focus Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-lg border border-border mb-8"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Focus Areas
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {vicePresident.focus}
            </p>
          </motion.div>

          {/* Responsibilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-6 rounded-lg border border-border mb-8"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Key Responsibilities
            </h3>
            <ul className="space-y-3">
              {vicePresident.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">
                    {responsibility}
                  </span>
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
                href={`mailto:${vicePresident.contact.email}`}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <span className="text-xl">📧</span>
                <div>
                  <div className="font-medium text-foreground">Email</div>
                  <div className="text-sm text-muted-foreground">
                    {vicePresident.contact.email}
                  </div>
                </div>
              </a>
              {vicePresident.contact.linkedin && (
                <a
                  href={vicePresident.contact.linkedin}
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
              {vicePresident.contact.github && (
                <a
                  href={vicePresident.contact.github}
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
