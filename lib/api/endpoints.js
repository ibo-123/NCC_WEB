/**
 * Frontend API integration contract map matching docs/API_CONTRACT.md.
 * Currently backed by the client-side mock store in PlatformProvider;
 * swap adapter calls here to fetch() when the backend routes are ready.
 */

export const API_ENDPOINTS = Object.freeze({
  auth: {
    register: { method: "POST", path: "/api/auth/register" },
    login: { method: "POST", path: "/api/auth/login" },
    logout: { method: "POST", path: "/api/auth/logout" },
    me: { method: "GET", path: "/api/auth/me" },
    verify2fa: { method: "POST", path: "/api/auth/2fa/verify" },
    handles: { method: "PUT", path: "/api/users/me/handles" },
  },
  student: {
    dashboard: { method: "GET", path: "/api/dashboard" },
    announcements: { method: "GET", path: "/api/announcements" },
    announcement: (id) => ({ method: "GET", path: `/api/announcements/${id}` }),
    notifications: { method: "GET", path: "/api/notifications" },
    lectures: { method: "GET", path: "/api/lectures" },
    lecture: (id) => ({ method: "GET", path: `/api/lectures/${id}` }),
    checkin: (lectureId) => ({ method: "POST", path: `/api/lectures/${lectureId}/attendance` }),
    attendanceMe: { method: "GET", path: "/api/attendance/me" },
    contests: { method: "GET", path: "/api/contests" },
    contest: (id) => ({ method: "GET", path: `/api/contests/${id}` }),
    contestResults: (id) => ({ method: "GET", path: `/api/contests/${id}/results` }),
    teamMe: { method: "GET", path: "/api/teams/me" },
    teamCreate: { method: "POST", path: "/api/teams" },
    teamJoin: { method: "POST", path: "/api/teams/join" },
    teamLeave: { method: "POST", path: "/api/teams/me/leave" },
    teamRemoveMember: (userId) => ({ method: "POST", path: `/api/teams/me/members/${userId}/remove` }),
    teamTransfer: { method: "POST", path: "/api/teams/me/transfer" },
    teamDisband: { method: "POST", path: "/api/teams/me/disband" },
    progressMe: { method: "GET", path: "/api/progress/me" },
    topicProblems: (id) => ({ method: "GET", path: `/api/progress/topics/${id}/problems` }),
    problem: (id) => ({ method: "GET", path: `/api/progress/problems/${id}` }),
    verifyProblem: (id) => ({ method: "POST", path: `/api/problems/${id}/verify` }),
    ratingMe: { method: "GET", path: "/api/rating/me" },
    ratingHistory: { method: "GET", path: "/api/rating/me/history" },
    streakMe: { method: "GET", path: "/api/streak/me" },
  },
  admin: {
    dashboard: { method: "GET", path: "/api/admin/dashboard" },
    auditLog: { method: "GET", path: "/api/admin/audit-log" },
    users: { method: "GET", path: "/api/admin/users" },
    user: (id) => ({ method: "GET", path: `/api/admin/users/${id}` }),
    reopenUser: (id) => ({ method: "POST", path: `/api/admin/users/${id}/reopen` }),
    teams: { method: "GET", path: "/api/admin/teams" },
    team: (id) => ({ method: "GET", path: `/api/admin/teams/${id}` }),
    disbandTeam: (id) => ({ method: "POST", path: `/api/admin/teams/${id}/disband` }),
    announcements: { method: "GET", path: "/api/admin/announcements" },
    publishAnnouncement: (id) => ({ method: "POST", path: `/api/admin/announcements/${id}/publish` }),
    lectures: { method: "GET", path: "/api/admin/lectures" },
    publishLecture: (id) => ({ method: "POST", path: `/api/admin/lectures/${id}/publish` }),
    attendance: { method: "GET", path: "/api/admin/attendance" },
    startAttendance: (lectureId) => ({ method: "POST", path: `/api/admin/lectures/${lectureId}/attendance/start` }),
    closeAttendance: (sessionId) => ({ method: "POST", path: `/api/admin/attendance/${sessionId}/close` }),
    contests: { method: "GET", path: "/api/admin/contests" },
    publishContest: (id) => ({ method: "POST", path: `/api/admin/contests/${id}/publish` }),
    fetchResults: (id) => ({ method: "POST", path: `/api/admin/contests/${id}/results/fetch` }),
    publishResults: (id) => ({ method: "POST", path: `/api/admin/contests/${id}/results/publish` }),
    topics: { method: "GET", path: "/api/admin/topics" },
    problems: { method: "GET", path: "/api/admin/problems" },
    publishProblem: (id) => ({ method: "POST", path: `/api/admin/problems/${id}/publish` }),
    progress: { method: "GET", path: "/api/admin/progress" },
    rating: { method: "GET", path: "/api/admin/rating" },
    setup2fa: { method: "POST", path: "/api/admin/security/2fa/setup" },
    confirm2fa: { method: "POST", path: "/api/admin/security/2fa/confirm" },
  },
});

/** Shared byte-length helper per DECISIONS.md T19 (8-72 UTF-8 bytes). */
export function utf8ByteLength(str) {
  return new TextEncoder().encode(str ?? "").length;
}
