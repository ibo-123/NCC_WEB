import { listAuditEntries } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { ActivityEvent } from "@/models/ActivityEvent.js";
import { Announcement } from "@/models/Announcement.js";
import { AttendanceSession } from "@/models/AttendanceSession.js";
import { Contest } from "@/models/Contest.js";
import { Lecture } from "@/models/Lecture.js";
import { Problem } from "@/models/Problem.js";
import { Team } from "@/models/Team.js";
import { User } from "@/models/User.js";
import { listAnnouncements } from "./announcements.js";
import { getAttendanceSummary } from "./attendance.js";
import { listContests } from "./contests.js";
import { listLectures } from "./lectures.js";
import { getMyProgress } from "./progress.js";
import { getMyRating } from "./rating.js";
import { getStreak } from "./streak.js";
import { getMyTeam } from "./teams.js";

export async function getStudentDashboard(ctx) {
  await connectDb();
  const [
    rating,
    attendance,
    progress,
    lecturesPage,
    individualContestsPage,
    teamContestsPage,
    team,
    announcementsPage,
    streak,
    recentEvents,
  ] = await Promise.all([
    getMyRating(ctx),
    getAttendanceSummary(ctx.actor.id),
    getMyProgress(ctx),
    listLectures(ctx, { page: 1, limit: 5 }),
    listContests(ctx, { page: 1, limit: 5, mode: "individual" }),
    listContests(ctx, { page: 1, limit: 5, mode: "team" }),
    getMyTeam(ctx),
    listAnnouncements(ctx, { page: 1, limit: 5 }),
    getStreak(ctx),
    ActivityEvent.find({ userId: ctx.actor.id }).sort({ occurredAt: -1 }).limit(6).lean(),
  ]);

  const recentActivity = recentEvents.map((ev) => ({
    id: String(ev._id),
    type: ev.type,
    day: ev.day,
    occurredAt: new Date(ev.occurredAt).toISOString(),
  }));

  return {
    rating,
    attendance,
    progress: { solved: progress.solved, total: progress.total, topics: progress.topics },
    upcomingLectures: lecturesPage.items,
    upcomingContests: individualContestsPage.items,
    upcomingTeamContests: teamContestsPage.items,
    team,
    announcements: announcementsPage.items,
    streak,
    recentActivity,
  };
}

export async function getAdminDashboard() {
  await connectDb();
  const [
    totalStudents,
    activeStudents,
    restrictedStudents,
    publishedContests,
    openAttendanceSessions,
    activeTeams,
    publishedProblems,
    publishedLectures,
    draftAnnouncements,
    recentAudit,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "student", status: "active" }),
    User.countDocuments({ role: "student", status: "restricted" }),
    Contest.countDocuments({ publication: "published", deletedAt: null }),
    AttendanceSession.countDocuments({ closedAt: null }),
    Team.countDocuments({ status: "active", deletedAt: null }),
    Problem.countDocuments({ status: "published", deletedAt: null }),
    Lecture.countDocuments({ status: "published", deletedAt: null }),
    Announcement.countDocuments({ status: "draft", deletedAt: null }),
    listAuditEntries({ page: 1, limit: 10 }),
  ]);

  return {
    stats: {
      totalStudents,
      activeStudents,
      restrictedStudents,
      publishedContests,
      openAttendanceSessions,
      activeTeams,
      publishedProblems,
      publishedLectures,
      draftAnnouncements,
    },
    recentActivity: recentAudit.items,
  };
}
