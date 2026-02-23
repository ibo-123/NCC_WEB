// app/faq/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "What is NCC MSJ?",
      answer:
        "NCC MSJ is the competitive programming and software development club at our institution. We focus on algorithmic problem-solving, coding competitions, software development projects, and building a community of passionate programmers.",
      category: "general",
    },
    {
      id: "2",
      question: "How do I join the club?",
      answer:
        "To join NCC MSJ, you need to be a current student at our institution. Attend our orientation sessions at the beginning of each semester, fill out the membership application, and participate in our introductory coding challenges. Membership is free for all students.",
      category: "membership",
    },
    {
      id: "3",
      question: "What programming languages do we use?",
      answer:
        "We primarily focus on C++, Java, and Python for competitive programming. For web development, we use JavaScript/TypeScript with React, Node.js, and various backend technologies. We encourage learning multiple languages to broaden your programming skills.",
      category: "programming",
    },
    {
      id: "4",
      question: "How often do we have coding contests?",
      answer:
        "We organize weekly coding contests on platforms like CodeChef, CodeForces, and LeetCode. We also participate in inter-college competitions and host our own internal contests. Regular practice sessions are held twice a week.",
      category: "contests",
    },
    {
      id: "5",
      question: "Do you offer mentorship programs?",
      answer:
        "Yes! We have a comprehensive mentorship program where senior members guide beginners. We also organize workshops, study groups, and one-on-one mentoring sessions. Our mentors help with competitive programming, interview preparation, and project development.",
      category: "mentorship",
    },
    {
      id: "6",
      question: "What resources are available for learning?",
      answer:
        "We provide access to premium coding platforms, maintain a resource library with books and online courses, organize workshops on various topics, and have a code repository with solutions to common problems. Members also get access to our internal learning management system.",
      category: "resources",
    },
    {
      id: "7",
      question: "How does the rating system work?",
      answer:
        "Our rating system is based on your performance in coding contests and problem-solving activities. Points are awarded based on problem difficulty, speed of solution, and consistency. Higher ratings unlock more privileges and recognition within the club.",
      category: "rating",
    },
    {
      id: "8",
      question: "Can I work on real projects?",
      answer:
        "Absolutely! We encourage members to work on open-source projects, participate in hackathons, and contribute to real-world applications. We have ongoing projects in web development, mobile apps, machine learning, and system design that you can join.",
      category: "projects",
    },
    {
      id: "9",
      question: "What are the benefits of joining NCC MSJ?",
      answer:
        "Benefits include skill development in competitive programming, access to exclusive resources, mentorship opportunities, networking with industry professionals, internship referrals, participation in coding competitions, and building a strong portfolio for job applications.",
      category: "benefits",
    },
    {
      id: "10",
      question: "How can I prepare for coding interviews?",
      answer:
        "We offer specialized interview preparation sessions covering data structures, algorithms, system design, and behavioral questions. We also conduct mock interviews and provide feedback. Our alumni network shares their interview experiences and tips.",
      category: "career",
    },
  ];

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "general", label: "General" },
    { id: "membership", label: "Membership" },
    { id: "programming", label: "Programming" },
    { id: "contests", label: "Contests" },
    { id: "mentorship", label: "Mentorship" },
    { id: "resources", label: "Resources" },
    { id: "rating", label: "Rating System" },
    { id: "projects", label: "Projects" },
    { id: "benefits", label: "Benefits" },
    { id: "career", label: "Career" },
  ];

  const filteredFAQs =
    selectedCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

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
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about NCC MSJ
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {faq.question}
                  </span>
                  <span
                    className={`transform transition-transform ${
                      openFAQ === faq.id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <AnimatePresence>
                  {openFAQ === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-card p-6 rounded-lg border border-border text-center"
          >
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Feel free to reach out
              to us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@ncc-msj.edu"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Email Us
              </a>
              <a
                href="/contact"
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Contact Page
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
