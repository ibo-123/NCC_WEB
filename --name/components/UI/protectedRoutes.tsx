"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (adminOnly) {
      // Check if user is admin from localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role !== "admin") {
            router.push("/dashboard");
            return;
          }
        } catch (e) {
          router.push("/login");
          return;
        }
      } else {
        router.push("/login");
        return;
      }
    }
  }, [router, adminOnly]);

  return <>{children}</>;
}
