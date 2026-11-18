"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, RotateCcw, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { AppShell } from "./AppShell.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { getInitials } from "@/lib/status.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";

const STUDENT_SECTIONS = [
  {
    title: "Shared",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/announcements", label: "Announcements", icon: "announcements" },
      { href: "/lectures", label: "Lectures", icon: "lectures" },
      { href: "/attendance", label: "Attendance", icon: "attendance" },
      { href: "/progress", label: "Progress", icon: "progress" },
      { href: "/rating", label: "Rating", icon: "rating" },
      { href: "/profile", label: "Profile", icon: "profile" },
    ],
  },
  {
    title: "Individual",
    items: [
      { href: "/contests", label: "Contests", icon: "contests" },
      { href: "/results", label: "Results", icon: "results" },
      { href: "/streak", label: "My streak", icon: "streak" },
    ],
  },
  {
    title: "Group",
    items: [
      { href: "/teams", label: "My team", icon: "users" },
      { href: "/team-contests", label: "Team contests", icon: "contests" },
      { href: "/team-results", label: "Team results", icon: "results" },
      { href: "/team-streak", label: "Team streak", icon: "streak" },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/notifications", label: "Notifications", icon: "notifications" },
      { href: "/admin/audit-log", label: "Audit log", icon: "audit" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: "users" },
      { href: "/admin/restricted", label: "Restricted", icon: "restricted" },
      { href: "/admin/teams", label: "Teams", icon: "users" },
    ],
  },
  {
    title: "Learning",
    items: [
      { href: "/admin/announcements", label: "Announcements", icon: "announcements" },
      { href: "/admin/lectures", label: "Lectures", icon: "lectures" },
      { href: "/admin/attendance", label: "Attendance", icon: "attendance" },
    ],
  },
  {
    title: "Competition",
    items: [
      { href: "/admin/contests", label: "Contests", icon: "contests" },
      { href: "/admin/results", label: "Results", icon: "results" },
    ],
  },
  {
    title: "Practice",
    items: [
      { href: "/admin/problems", label: "Problems", icon: "problems" },
      { href: "/admin/topics", label: "Topics", icon: "topics" },
      { href: "/admin/progress", label: "Progress", icon: "progress" },
    ],
  },
  {
    title: "Performance",
    items: [{ href: "/admin/rating", label: "Rating", icon: "rating" }],
  },
];

export function PlatformShell({ mode = "student", breadcrumbs = [], children }) {
  const router = useRouter();
  const { currentUser, currentTeam, hydrated, logout, switchRoleQuick, resetDemoData } = usePlatform();

  useEffect(() => {
    if (!hydrated) return;
    if (mode === "student" && currentUser?.status === "restricted") {
      router.replace("/restricted");
    }
  }, [hydrated, mode, currentUser, router]);

  const isAdminMode = mode === "admin";
  const brand = {
    name: "NCC_DSA",
    sub: isAdminMode ? "Admin Console" : "Student Portal",
    href: isAdminMode ? "/admin" : "/dashboard",
  };

  const userSummary = currentUser
    ? {
        name: currentUser.name,
        initials: getInitials(currentUser.name),
        detail:
          currentUser.role === "admin"
            ? "Administrator"
            : currentTeam
              ? `Team: ${currentTeam.name}`
              : currentUser.rating !== null
                ? `Rating ${currentUser.rating.toFixed(2)}`
                : "Student",
      }
    : { name: "Guest", initials: "G", detail: "Not signed in" };

  const footer = (
    <div className="flex flex-col gap-1 border-t border-border pt-3">
      {isAdminMode ? (
        <Link
          href="/admin/security/2fa"
          className="flex min-h-9 items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-sm font-medium text-sidebar-fg no-underline hover:bg-sidebar-hover"
        >
          <ShieldCheck aria-hidden="true" size={17} />
          Two-factor auth
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (isAdminMode) {
            switchRoleQuick("u-ibrahim");
            router.push("/dashboard");
          } else {
            switchRoleQuick("u-marta");
            router.push("/admin");
          }
        }}
        className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[3px] border-0 bg-transparent px-2.5 py-1.5 text-left text-sm font-medium text-sidebar-fg hover:bg-sidebar-hover"
      >
        <ArrowLeftRight aria-hidden="true" size={17} />
        {isAdminMode ? "Switch to Student" : "Switch to Admin"}
      </button>

      <button
        type="button"
        onClick={resetDemoData}
        className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[3px] border-0 bg-transparent px-2.5 py-1.5 text-left text-sm font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg"
      >
        <RotateCcw aria-hidden="true" size={17} />
        Reset sample data
      </button>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[3px] border-0 bg-transparent px-2.5 py-1.5 text-left text-sm font-medium text-sidebar-fg hover:bg-sidebar-hover"
      >
        <LogOut aria-hidden="true" size={17} />
        Log out
      </button>
    </div>
  );

  let body = children;

  if (hydrated && !currentUser) {
    body = (
      <EmptyState
        title="Sign in required"
        description="Select a demo account or sign in to view this workspace."
        action={
          <>
            <ButtonLink href="/login">Go to sign in</ButtonLink>
            <Button
              variant="outline"
              onClick={() => {
                switchRoleQuick(isAdminMode ? "u-marta" : "u-ibrahim");
              }}
            >
              Continue as {isAdminMode ? "Marta Alemu (Admin)" : "Ibrahim Kedir (Student)"}
            </Button>
          </>
        }
      />
    );
  } else if (hydrated && isAdminMode && currentUser?.role !== "admin") {
    body = (
      <EmptyState
        title="Admin access required"
        description={`You are currently signed in as ${currentUser.name} (${currentUser.role}). Switch to the admin account to access Admin Console pages.`}
        action={
          <>
            <Button onClick={() => switchRoleQuick("u-marta")}>Switch to Marta Alemu (Admin)</Button>
            <ButtonLink href="/dashboard" variant="outline">
              Return to student dashboard
            </ButtonLink>
          </>
        }
      />
    );
  }

  return (
    <AppShell
      brand={brand}
      sections={isAdminMode ? ADMIN_SECTIONS : STUDENT_SECTIONS}
      user={userSummary}
      breadcrumbs={breadcrumbs}
      notificationsHref={isAdminMode ? "/admin/notifications" : "/notifications"}
      profileHref={isAdminMode ? "/admin/security/2fa" : "/profile"}
      footer={footer}
    >
      {body}
    </AppShell>
  );
}
