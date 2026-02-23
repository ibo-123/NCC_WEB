// app/contact/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/UI/protectedRoutes";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: "📧",
      title: "Email",
      details: "contact@ncc-msj.edu",
      description: "General inquiries and support",
    },
    {
      icon: "📍",
      title: "Location",
      details: "Computer Science Building, Room 301",
      description: "Visit us during office hours",
    },
    {
      icon: "⏰",
      title: "Office Hours",
      details: "Mon-Fri: 9 AM - 5 PM",
      description: "Club meetings: Wednesdays 6 PM",
    },
    {
      icon: "📱",
      title: "Social Media",
      details: "@ncc_msj_official",
      description: "Follow us for updates",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground">
              Get in touch with the NCC MSJ team
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Get in Touch
                </h2>
                <p className="text-muted-foreground mb-6">
                  Have questions about our club, want to join, or need help with
                  programming? We'd love to hear from you!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-card p-4 rounded-lg border border-border"
                  >
                    <div className="text-3xl mb-3">{info.icon}</div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {info.title}
                    </h3>
                    <p className="text-primary font-medium mb-1">
                      {info.details}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {info.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Leadership Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card p-6 rounded-lg border border-border"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Leadership Team
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground">President</h4>
                    <p className="text-muted-foreground">
                      president@ncc-msj.edu
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      Vice President
                    </h4>
                    <p className="text-muted-foreground">
                      vice-president@ncc-msj.edu
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      Technical Lead
                    </h4>
                    <p className="text-muted-foreground">tech@ncc-msj.edu</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card p-6 rounded-lg border border-border"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Send us a Message
              </h2>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-muted-foreground">
                    Thank you for contacting us. We'll get back to you soon.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="membership">Club Membership</option>
                      <option value="events">Events & Contests</option>
                      <option value="mentorship">Mentorship Program</option>
                      <option value="technical">Technical Support</option>
                      <option value="partnership">Partnerships</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
