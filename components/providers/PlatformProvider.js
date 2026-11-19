"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ToastViewport } from "@/components/ui/Toast.js";
import { formatShortDate } from "@/lib/status.js";

const PlatformContext = createContext(null);

function makeToastId() {
  return `toast-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyStore() {
  return {
    currentUserId: null,
    pending2faUserId: null,
    registrationOpen: true,
    admin2faEnabled: false,
    restrictedContactEmail: "dsa-heads@ncc.edu",
    users: [],
    teams: [],
    announcements: [],
    lectures: [],
    attendanceSessions: [],
    topics: [],
    problems: [],
    verifications: {},
    studentProgressSummaries: {},
    contests: [],
    contestResults: {},
    teamContestResults: {},
    ratingHistory: {},
    notifications: [],
    auditLogs: [],
    recentActivity: [],
    heatmapIndividual: [],
    heatmapTeam: [],
    individualStreak: { current: 0, longest: 0, activeDays: 0 },
  };
}

const DEMO_ACCOUNTS = {
  "u-ibrahim": {
    email: "ibrahim.kedir@ncc.edu",
    password: "studentpass123",
  },
  "u-marta": {
    email: "marta.alemu@ncc.edu",
    password: "adminpass123",
  },
  "u-liya": {
    email: "liya.mekonnen@ncc.edu",
    password: "studentpass123",
  },
};

function formatActivityTitle(type) {
  switch (type) {
    case "problem_solved":
      return "Problem solved";
    case "attendance":
      return "Attendance recorded";
    case "contest_result":
      return "Contest result";
    case "team_contest_result":
      return "Team contest result";
    default:
      return "Activity";
  }
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: { code: "NETWORK_ERROR", message: "Unable to reach server. Please try again." },
    };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.success) {
    return {
      ok: false,
      status: res.status,
      error: payload?.error ?? {
        code: "REQUEST_FAILED",
        message: `Request failed (${res.status})`,
      },
    };
  }

  return { ok: true, status: res.status, data: payload.data };
}

function normalizeContest(c) {
  return {
    ...c,
    publication: c.publication ?? "published",
    resultsState: c.resultsState ?? (c.resultsPublished ? "published" : "not_fetched"),
    fetchSummary: c.fetchSummary ?? null,
    platformContestId: c.platformContestId ?? "",
  };
}

function normalizeRatingItems(items) {
  return (items ?? []).map((pt) => ({
    ...pt,
    label: pt.label ?? formatShortDate(pt.computedAt),
  }));
}

export function PlatformProvider({ children }) {
  const [store, setStore] = useState(() => createEmptyStore());
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((tone, title, body) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, tone, title, body }]);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    }
  }, []);

  const hydrate = useCallback(async () => {
    const meRes = await apiFetch("/api/auth/me");
    if (!meRes.ok) {
      setStore(createEmptyStore());
      setHydrated(true);
      return null;
    }

    const { user, admin2faEnabled, registrationOpen, restrictedContactEmail } = meRes.data;

    if (user.status === "restricted") {
      setStore({
        ...createEmptyStore(),
        currentUserId: user.id,
        registrationOpen: Boolean(registrationOpen),
        admin2faEnabled: Boolean(admin2faEnabled),
        restrictedContactEmail: restrictedContactEmail ?? "dsa-heads@ncc.edu",
        users: [user],
      });
      setHydrated(true);
      return user;
    }

    if (user.role === "admin") {
      const [
        dashRes,
        usersRes,
        teamsRes,
        annRes,
        lecRes,
        attRes,
        conRes,
        topRes,
        probRes,
        progRes,
        ratingRes,
        auditRes,
      ] = await Promise.all([
        apiFetch("/api/admin/dashboard"),
        apiFetch("/api/admin/users?limit=100"),
        apiFetch("/api/admin/teams?limit=100"),
        apiFetch("/api/admin/announcements?limit=100"),
        apiFetch("/api/admin/lectures?limit=100"),
        apiFetch("/api/admin/attendance?limit=100"),
        apiFetch("/api/admin/contests?limit=100"),
        apiFetch("/api/admin/topics?limit=100"),
        apiFetch("/api/admin/problems?limit=100"),
        apiFetch("/api/admin/progress?limit=100"),
        apiFetch("/api/admin/rating?limit=100"),
        apiFetch("/api/admin/audit-log?limit=100"),
      ]);

      const rawSessions = attRes.ok ? (attRes.data.items ?? []) : [];
      const sessionsToFetch = rawSessions.filter((s, idx) => !s.closedAt || idx < 15);
      const detailResults = await Promise.all(
        sessionsToFetch.map((s) => apiFetch(`/api/admin/attendance/${s.id}?limit=100`)),
      );
      const detailById = new Map();
      sessionsToFetch.forEach((s, idx) => {
        if (detailResults[idx]?.ok) {
          detailById.set(s.id, detailResults[idx].data);
        }
      });

      const attendanceSessions = rawSessions.map((s) => {
        const detail = detailById.get(s.id);
        return {
          ...s,
          code: detail?.session?.code ?? s.code ?? null,
          records: detail?.records?.items ?? [],
        };
      });

      const ratingHistory = {};
      for (const r of ratingRes.ok ? (ratingRes.data.items ?? []) : []) {
        if (r.rating !== null && r.rating !== undefined) {
          ratingHistory[r.userId] = [
            {
              id: `latest-${r.userId}`,
              value: r.rating,
              previous: r.previous ?? null,
              change: r.change ?? null,
              source: "term",
              computedAt: r.computedAt,
              label: formatShortDate(r.computedAt),
            },
          ];
        }
      }

      const studentProgressSummaries = {};
      for (const p of progRes.ok ? (progRes.data.items ?? []) : []) {
        studentProgressSummaries[p.userId] = p;
      }

      const rawUsers = usersRes.ok ? (usersRes.data.items ?? []) : [user];
      const users = rawUsers.some((u) => u.id === user.id) ? rawUsers : [user, ...rawUsers];

      const contests = (conRes.ok ? (conRes.data.items ?? []) : []).map(normalizeContest);

      setStore({
        ...createEmptyStore(),
        currentUserId: user.id,
        registrationOpen: Boolean(registrationOpen),
        admin2faEnabled: Boolean(admin2faEnabled),
        restrictedContactEmail: restrictedContactEmail ?? "dsa-heads@ncc.edu",
        users,
        teams: teamsRes.ok ? (teamsRes.data.items ?? []) : [],
        announcements: annRes.ok ? (annRes.data.items ?? []) : [],
        lectures: lecRes.ok ? (lecRes.data.items ?? []) : [],
        attendanceSessions,
        topics: topRes.ok ? (topRes.data.items ?? []) : [],
        problems: probRes.ok ? (probRes.data.items ?? []) : [],
        studentProgressSummaries,
        contests,
        ratingHistory,
        auditLogs: auditRes.ok
          ? (auditRes.data.items ?? [])
          : dashRes.ok
            ? (dashRes.data.recentActivity ?? [])
            : [],
      });
      setHydrated(true);
      return user;
    }

    // Active student hydration
    const [
      dashRes,
      progressRes,
      annRes,
      lecRes,
      attRes,
      conRes,
      teamRes,
      ratingHistRes,
      notifRes,
      streakRes,
    ] = await Promise.all([
      apiFetch("/api/dashboard"),
      apiFetch("/api/progress/me"),
      apiFetch("/api/announcements?limit=100"),
      apiFetch("/api/lectures?limit=100"),
      apiFetch("/api/attendance/me?limit=100"),
      apiFetch("/api/contests?limit=100"),
      apiFetch("/api/teams/me"),
      apiFetch("/api/rating/me/history?limit=100"),
      apiFetch("/api/notifications?limit=100"),
      apiFetch("/api/streak/me"),
    ]);

    const topics = progressRes.ok ? (progressRes.data.topics ?? []) : [];
    const topicProblemRes = await Promise.all(
      topics.map((t) => apiFetch(`/api/progress/topics/${t.id}/problems?limit=100`)),
    );

    const problems = [];
    const verifications = {};
    topicProblemRes.forEach((res) => {
      if (!res.ok) return;
      for (const p of res.data.items ?? []) {
        problems.push({ ...p, status: "published" });
        verifications[`${user.id}:${p.id}`] = {
          status: p.status ?? "unsolved",
          solvedAt: p.solvedAt ?? null,
          lastCheckedAt: p.lastCheckedAt ?? null,
        };
      }
    });

    const announcements = (annRes.ok ? (annRes.data.items ?? []) : []).map((a) => ({
      ...a,
      status: "published",
      createdBy: a.createdBy ?? "NCC Coordinator",
    }));

    const lectures = (lecRes.ok ? (lecRes.data.items ?? []) : []).map((l) => ({
      ...l,
      status: "published",
    }));

    const contests = (conRes.ok ? (conRes.data.items ?? []) : []).map(normalizeContest);

    // Build student attendance sessions from live lectures + history
    const attHistoryItems = attRes.ok ? (attRes.data.history?.items ?? []) : [];
    const attendedCount = attRes.ok ? (attRes.data.summary?.attended ?? 0) : 0;
    const attendanceSessions = [];

    for (const lec of lectures) {
      if (lec.attendance?.sessionOpen) {
        attendanceSessions.push({
          id: `open-${lec.id}`,
          lectureId: lec.id,
          lectureTitle: lec.title,
          opensAt: lec.scheduledAt,
          closedAt: null,
          code: null,
          records: lec.attendance.checkedIn
            ? [{ userId: user.id, name: user.name, submittedAt: lec.scheduledAt }]
            : [],
        });
      }
    }

    for (const h of attHistoryItems) {
      const hasOpenForLecture = attendanceSessions.some((s) => s.lectureId === h.lectureId);
      if (hasOpenForLecture) continue;
      attendanceSessions.push({
        id: `hist-${h.lectureId}-${h.submittedAt}`,
        lectureId: h.lectureId,
        lectureTitle: h.title,
        opensAt: h.submittedAt,
        closedAt: h.submittedAt,
        code: null,
        records: [{ userId: user.id, name: user.name, submittedAt: h.submittedAt }],
      });
    }

    // Prefetch published results for recent published contests so ResultsView renders immediately
    const publishedResultContests = contests.filter((c) => c.resultsState === "published").slice(0, 5);
    const resultFetches = await Promise.all(
      publishedResultContests.map((c) => apiFetch(`/api/contests/${c.id}/results?limit=100`)),
    );
    const contestResults = {};
    const teamContestResults = {};
    publishedResultContests.forEach((c, idx) => {
      const r = resultFetches[idx];
      if (!r?.ok) return;
      if (c.mode === "team") {
        contestResults[c.id] = r.data.members ?? [];
        teamContestResults[c.id] = r.data.teams ?? [];
      } else {
        contestResults[c.id] = r.data.items ?? [];
      }
    });

    const recentActivity = (dashRes.ok ? (dashRes.data.recentActivity ?? []) : []).map((ev) => ({
      id: ev.id,
      title: formatActivityTitle(ev.type),
      detail: ev.day,
      date: formatShortDate(ev.occurredAt),
    }));

    const studentUser = { ...user, attendedCount };
    const team = teamRes.ok ? teamRes.data : null;
    const streakData = streakRes.ok ? streakRes.data : dashRes.ok ? dashRes.data.streak : null;

    setStore({
      ...createEmptyStore(),
      currentUserId: user.id,
      registrationOpen: Boolean(registrationOpen),
      admin2faEnabled: Boolean(admin2faEnabled),
      restrictedContactEmail: restrictedContactEmail ?? "dsa-heads@ncc.edu",
      users: [studentUser],
      teams: team ? [team] : [],
      announcements,
      lectures,
      attendanceSessions,
      topics,
      problems,
      verifications,
      contests,
      contestResults,
      teamContestResults,
      ratingHistory: {
        [user.id]: normalizeRatingItems(ratingHistRes.ok ? ratingHistRes.data.items : []),
      },
      notifications: notifRes.ok ? (notifRes.data.items ?? []) : [],
      recentActivity,
      heatmapIndividual: streakData?.individual?.cells ?? [],
      heatmapTeam: streakData?.team?.cells ?? [],
      individualStreak: streakData?.individual ?? { current: 0, longest: 0, activeDays: 0 },
    });
    setHydrated(true);
    return studentUser;
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const currentUser = useMemo(
    () => store.users.find((u) => u.id === store.currentUserId) ?? null,
    [store.users, store.currentUserId],
  );

  const currentTeam = useMemo(() => {
    if (!currentUser) return null;
    return (
      store.teams.find(
        (t) => t.status === "active" && t.members.some((m) => m.userId === currentUser.id),
      ) ?? null
    );
  }, [store.teams, currentUser]);

  const resetDemoData = useCallback(async () => {
    await hydrate();
    pushToast("info", "Workspace synced", "Latest records loaded from the database.");
  }, [hydrate, pushToast]);

  // ---- Lazy detail loaders ----
  const loadContestResults = useCallback(async (contestId, isAdmin = false) => {
    if (!contestId) return;
    const url = isAdmin
      ? `/api/admin/contests/${contestId}/results?limit=100`
      : `/api/contests/${contestId}/results?limit=100`;
    const res = await apiFetch(url);
    if (!res.ok) return;
    setStore((prev) => ({
      ...prev,
      contestResults: {
        ...prev.contestResults,
        [contestId]: res.data.members ?? res.data.items ?? [],
      },
      ...(res.data.teams
        ? {
            teamContestResults: {
              ...prev.teamContestResults,
              [contestId]: res.data.teams,
            },
          }
        : {}),
    }));
  }, []);

  const loadStudentProgress = useCallback(async (userId) => {
    if (!userId) return;
    const res = await apiFetch(`/api/admin/progress/${userId}?limit=100`);
    if (!res.ok) return;
    setStore((prev) => {
      const nextVerifs = { ...prev.verifications };
      for (const p of res.data.items ?? []) {
        nextVerifs[`${userId}:${p.id}`] = {
          status: p.status ?? "unsolved",
          solvedAt: p.solvedAt ?? null,
          lastCheckedAt: p.lastCheckedAt ?? null,
        };
      }
      return { ...prev, verifications: nextVerifs };
    });
  }, []);

  // ---- Auth Actions ----
  const login = useCallback(
    async (email, password) => {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: res.error.message,
          fieldErrors: res.error.fields,
        };
      }
      if (res.data.requiresTwoFactor) {
        setStore((prev) => ({
          ...prev,
          pending2faUserId: res.data.user.id,
        }));
        return { ok: true, requiresTwoFactor: true, user: res.data.user };
      }
      const hydratedUser = await hydrate();
      return {
        ok: true,
        requiresTwoFactor: false,
        user: hydratedUser ?? res.data.user,
      };
    },
    [hydrate],
  );

  const verifyTwoFactor = useCallback(
    async (code) => {
      const res = await apiFetch("/api/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ code: String(code ?? "").trim() }),
      });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      return { ok: true };
    },
    [hydrate],
  );

  const register = useCallback(async ({ name, email, password, confirmPassword }) => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword: confirmPassword ?? password,
      }),
    });
    if (!res.ok) {
      if (res.status === 403) {
        setStore((prev) => ({ ...prev, registrationOpen: false }));
      }
      return {
        ok: false,
        error: res.error.message,
        fieldErrors: res.error.fields,
      };
    }
    return { ok: true, user: res.data.user };
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setStore(createEmptyStore());
    setHydrated(true);
  }, []);

  const switchRoleQuick = useCallback(
    async (userId) => {
      const creds = DEMO_ACCOUNTS[userId];
      if (!creds) return { ok: false, error: "Account preset not found." };
      const res = await login(creds.email, creds.password);
      if (!res.ok) {
        pushToast("bad", "Sign-in failed", res.error);
      }
      return res;
    },
    [login, pushToast],
  );

  const updateHandles = useCallback(
    async ({ codeforces, leetcode }) => {
      const res = await apiFetch("/api/users/me/handles", {
        method: "PUT",
        body: JSON.stringify({ codeforces, leetcode }),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: res.error.message,
          fieldErrors: res.error.fields,
        };
      }
      await hydrate();
      pushToast("ok", "Linked handles updated", "Changes saved to your profile.");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  // ---- Student Actions ----
  const checkInAttendance = useCallback(
    async (lectureId, code) => {
      const res = await apiFetch(`/api/lectures/${lectureId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ code: String(code ?? "").trim() }),
      });
      if (!res.ok) {
        return { ok: false, code: res.error.code, message: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Attendance recorded", "Your check-in has been saved.");
      return { ok: true, submittedAt: res.data.record.submittedAt };
    },
    [hydrate, pushToast],
  );

  const verifyProblem = useCallback(
    async (problemId) => {
      const res = await apiFetch(`/api/problems/${problemId}/verify`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        return { result: "failed", message: res.error.message };
      }
      await hydrate();
      if (res.data.result === "solved") {
        pushToast("ok", "Provisional solve check passed", "Problem marked solved.");
      }
      return res.data;
    },
    [hydrate, pushToast],
  );

  // ---- Team Actions ----
  const createTeam = useCallback(
    async (name) => {
      const res = await apiFetch("/api/teams", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Team created", `Invite code: ${res.data.inviteCode}`);
      return { ok: true, team: res.data };
    },
    [hydrate, pushToast],
  );

  const joinTeam = useCallback(
    async (inviteCode) => {
      const res = await apiFetch("/api/teams/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Joined team", `Welcome to ${res.data.name}.`);
      return { ok: true, team: res.data };
    },
    [hydrate, pushToast],
  );

  const leaveTeam = useCallback(async () => {
    const res = await apiFetch("/api/teams/me/leave", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      return { ok: false, error: res.error.message };
    }
    await hydrate();
    pushToast("info", "Left team");
    return { ok: true };
  }, [hydrate, pushToast]);

  const removeTeamMember = useCallback(
    async (userId) => {
      const res = await apiFetch(`/api/teams/me/members/${userId}/remove`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        pushToast("bad", "Unable to remove member", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("info", "Member removed");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const transferCaptaincy = useCallback(
    async (userId) => {
      const res = await apiFetch("/api/teams/me/transfer", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        pushToast("bad", "Transfer failed", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Captaincy transferred");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const disbandTeam = useCallback(
    async (teamId) => {
      const isAdmin = currentUser?.role === "admin" && teamId;
      const url = isAdmin ? `/api/admin/teams/${teamId}/disband` : "/api/teams/me/disband";
      const res = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        pushToast("bad", "Unable to disband team", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("info", "Team disbanded");
      return { ok: true };
    },
    [currentUser?.role, hydrate, pushToast],
  );

  // ---- Admin Actions ----
  const restrictUser = useCallback(
    async (userId, reason = "") => {
      const res = await apiFetch(`/api/admin/users/${userId}/restrict`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      if (!res.ok) {
        pushToast("bad", "Unable to restrict user", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("info", "Account restricted", res.data.name);
      return { ok: true, user: res.data };
    },
    [hydrate, pushToast],
  );

  const reopenUser = useCallback(
    async (userId) => {
      const res = await apiFetch(`/api/admin/users/${userId}/reopen`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        pushToast("bad", "Unable to reopen account", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Account access restored", `${res.data.name} can now access the full platform.`);
      return { ok: true, user: res.data };
    },
    [hydrate, pushToast],
  );

  const saveAnnouncement = useCallback(
    async (payload) => {
      const existing = payload.id ? store.announcements.find((a) => a.id === payload.id) : null;
      const body = {
        title: payload.title,
        body: payload.body,
        type: payload.type,
      };
      const res = payload.id
        ? await apiFetch(`/api/admin/announcements/${payload.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/api/admin/announcements", {
            method: "POST",
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }

      let finalStatus = res.data.status;
      if (payload.status === "published" && (!existing || existing.status === "draft")) {
        const pubRes = await apiFetch(`/api/admin/announcements/${res.data.id}/publish`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (!pubRes.ok) {
          await hydrate();
          return { ok: false, error: pubRes.error.message };
        }
        finalStatus = "published";
      }

      await hydrate();
      pushToast(
        "ok",
        finalStatus === "published" ? "Announcement published successfully" : "Announcement draft saved",
      );
      return { ok: true };
    },
    [store.announcements, hydrate, pushToast],
  );

  const publishAnnouncement = useCallback(
    async (id) => {
      const res = await apiFetch(`/api/admin/announcements/${id}/publish`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        pushToast("bad", "Publish failed", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Announcement published successfully");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const deleteAnnouncement = useCallback(
    async (id) => {
      const res = await apiFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        pushToast("bad", "Delete failed", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Announcement deleted");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const saveLecture = useCallback(
    async (payload) => {
      const existing = payload.id ? store.lectures.find((l) => l.id === payload.id) : null;
      const body = {
        title: payload.title,
        description: payload.description ?? "",
        scheduledAt: payload.scheduledAt,
        liveUrl: payload.liveUrl?.trim() ? payload.liveUrl.trim() : null,
        resources: payload.resources ?? [],
      };
      const res = payload.id
        ? await apiFetch(`/api/admin/lectures/${payload.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/api/admin/lectures", {
            method: "POST",
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }

      let finalStatus = res.data.status;
      if (payload.status === "published" && (!existing || existing.status === "draft")) {
        const pubRes = await apiFetch(`/api/admin/lectures/${res.data.id}/publish`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (!pubRes.ok) {
          await hydrate();
          return { ok: false, error: pubRes.error.message };
        }
        finalStatus = "published";
      }

      await hydrate();
      pushToast("ok", finalStatus === "published" ? "Lecture published" : "Lecture saved as draft");
      return { ok: true };
    },
    [store.lectures, hydrate, pushToast],
  );

  const deleteLecture = useCallback(
    async (id) => {
      const res = await apiFetch(`/api/admin/lectures/${id}`, { method: "DELETE" });
      if (!res.ok) {
        pushToast("bad", "Cannot delete lecture", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Lecture deleted");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const startAttendanceSession = useCallback(
    async (lectureId, validSeconds = 600) => {
      const res = await apiFetch(`/api/admin/lectures/${lectureId}/attendance/start`, {
        method: "POST",
        body: JSON.stringify({ validForSeconds: Number(validSeconds) || 600 }),
      });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Attendance session started", `Code: ${res.data.code}`);
      return { ok: true, session: res.data };
    },
    [hydrate, pushToast],
  );

  const closeAttendanceSession = useCallback(
    async (sessionId) => {
      const res = await apiFetch(`/api/admin/attendance/${sessionId}/close`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        pushToast("bad", "Unable to close session", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("info", "Attendance session closed");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const saveContest = useCallback(
    async (payload) => {
      const existing = payload.id ? store.contests.find((c) => c.id === payload.id) : null;
      const body = {
        title: payload.title,
        description: payload.description ?? "",
        mode: payload.mode === "team" ? "team" : "individual",
        platform: "codeforces",
        platformContestId: String(payload.platformContestId).trim(),
        url: payload.url.trim(),
        invitationUrl: payload.invitationUrl?.trim() ? payload.invitationUrl.trim() : null,
        startsAt: payload.startsAt,
        durationMinutes: Number(payload.durationMinutes) || (payload.mode === "team" ? 10080 : 120),
      };
      const res = payload.id
        ? await apiFetch(`/api/admin/contests/${payload.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/api/admin/contests", {
            method: "POST",
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }

      let finalPub = res.data.publication;
      if (payload.publication === "published" && (!existing || existing.publication === "draft")) {
        const pubRes = await apiFetch(`/api/admin/contests/${res.data.id}/publish`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (!pubRes.ok) {
          await hydrate();
          return { ok: false, error: pubRes.error.message };
        }
        finalPub = "published";
      }

      await hydrate();
      pushToast("ok", finalPub === "published" ? "Contest published" : "Contest draft saved");
      return { ok: true };
    },
    [store.contests, hydrate, pushToast],
  );

  const deleteContest = useCallback(
    async (id) => {
      const res = await apiFetch(`/api/admin/contests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        pushToast("bad", "Delete failed", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Contest deleted");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const fetchContestResults = useCallback(
    async (contestId) => {
      const res = await apiFetch(`/api/admin/contests/${contestId}/results/fetch`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await Promise.all([hydrate(), loadContestResults(contestId, true)]);
      pushToast("ok", "Results fetched successfully", `${res.data.matched} participants matched.`);
      return { ok: true, summary: res.data };
    },
    [hydrate, loadContestResults, pushToast],
  );

  const publishContestResults = useCallback(
    async (contestId) => {
      const res = await apiFetch(`/api/admin/contests/${contestId}/results/publish`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        pushToast("bad", "Publish failed", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await Promise.all([hydrate(), loadContestResults(contestId, true)]);
      pushToast("ok", "Results published", "Standings are now visible to students.");
      return { ok: true };
    },
    [hydrate, loadContestResults, pushToast],
  );

  const saveTopic = useCallback(
    async (payload) => {
      const body = {
        name: payload.name,
        ...(payload.slug?.trim() ? { slug: payload.slug.trim() } : {}),
        ...(payload.order !== "" && payload.order !== undefined ? { order: Number(payload.order) } : {}),
      };
      const res = payload.id
        ? await apiFetch(`/api/admin/topics/${payload.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/api/admin/topics", {
            method: "POST",
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", payload.id ? "Topic updated" : "Topic created");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const deleteTopic = useCallback(
    async (id) => {
      const res = await apiFetch(`/api/admin/topics/${id}`, { method: "DELETE" });
      if (!res.ok) {
        pushToast("bad", "Cannot delete topic", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Topic deleted");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const saveProblem = useCallback(
    async (payload) => {
      const existing = payload.id ? store.problems.find((p) => p.id === payload.id) : null;
      const body = {
        title: payload.title,
        topicId: payload.topicId,
        platform: payload.platform,
        url: payload.url,
        value: payload.value ? Number(payload.value) : null,
        externalRef:
          payload.platform === "codeforces"
            ? {
                contestId: Number(payload.contestId) || 1,
                index: String(payload.index || "A").trim().toUpperCase(),
              }
            : {
                titleSlug: String(payload.titleSlug || "").trim(),
              },
      };
      const res = payload.id
        ? await apiFetch(`/api/admin/problems/${payload.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/api/admin/problems", {
            method: "POST",
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }

      if (payload.status === "published" && (!existing || existing.status === "draft")) {
        const pubRes = await apiFetch(`/api/admin/problems/${res.data.id}/publish`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (!pubRes.ok) {
          await hydrate();
          return { ok: false, error: pubRes.error.message };
        }
      }

      await hydrate();
      pushToast("ok", payload.id ? "Problem updated" : "Problem added");
      return { ok: true };
    },
    [store.problems, hydrate, pushToast],
  );

  const deleteProblem = useCallback(
    async (id) => {
      const res = await apiFetch(`/api/admin/problems/${id}`, { method: "DELETE" });
      if (!res.ok) {
        pushToast("bad", "Delete failed", res.error.message);
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Problem deleted");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const setupTwoFactor = useCallback(async (password) => {
    const res = await apiFetch("/api/admin/security/2fa/setup", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      return { ok: false, error: res.error.message };
    }
    return { ok: true, secret: res.data.secret, otpauthUri: res.data.otpauthUri };
  }, []);

  const enrollTwoFactor = useCallback(
    async (code) => {
      const res = await apiFetch("/api/admin/security/2fa/confirm", {
        method: "POST",
        body: JSON.stringify({ code: String(code ?? "").trim() }),
      });
      if (!res.ok) {
        return { ok: false, error: res.error.message };
      }
      await hydrate();
      pushToast("ok", "Two-factor authentication enabled");
      return { ok: true };
    },
    [hydrate, pushToast],
  );

  const value = useMemo(
    () => ({
      store,
      hydrated,
      currentUser,
      currentTeam,
      pushToast,
      hydrate,
      resetDemoData,
      loadContestResults,
      loadStudentProgress,
      login,
      verifyTwoFactor,
      register,
      logout,
      switchRoleQuick,
      updateHandles,
      checkInAttendance,
      verifyProblem,
      createTeam,
      joinTeam,
      leaveTeam,
      removeTeamMember,
      transferCaptaincy,
      disbandTeam,
      restrictUser,
      reopenUser,
      saveAnnouncement,
      publishAnnouncement,
      deleteAnnouncement,
      saveLecture,
      deleteLecture,
      startAttendanceSession,
      closeAttendanceSession,
      saveContest,
      deleteContest,
      fetchContestResults,
      publishContestResults,
      saveTopic,
      deleteTopic,
      saveProblem,
      deleteProblem,
      setupTwoFactor,
      enrollTwoFactor,
    }),
    [
      store,
      hydrated,
      currentUser,
      currentTeam,
      pushToast,
      hydrate,
      resetDemoData,
      loadContestResults,
      loadStudentProgress,
      login,
      verifyTwoFactor,
      register,
      logout,
      switchRoleQuick,
      updateHandles,
      checkInAttendance,
      verifyProblem,
      createTeam,
      joinTeam,
      leaveTeam,
      removeTeamMember,
      transferCaptaincy,
      disbandTeam,
      restrictUser,
      reopenUser,
      saveAnnouncement,
      publishAnnouncement,
      deleteAnnouncement,
      saveLecture,
      deleteLecture,
      startAttendanceSession,
      closeAttendanceSession,
      saveContest,
      deleteContest,
      fetchContestResults,
      publishContestResults,
      saveTopic,
      deleteTopic,
      saveProblem,
      deleteProblem,
      setupTwoFactor,
      enrollTwoFactor,
    ],
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used inside PlatformProvider");
  return ctx;
}
