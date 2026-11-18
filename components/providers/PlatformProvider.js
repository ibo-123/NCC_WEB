"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createInitialStore } from "@/lib/mock/seedData.js";
import { ToastViewport } from "@/components/ui/Toast.js";

const STORAGE_KEY = "ncc-dsa-frontend-store-v1";
const PlatformContext = createContext(null);

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function randomCode(len, alphabet) {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function PlatformProvider({ children }) {
  const [store, setStore] = useState(() => createInitialStore());
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          setStore(parsed);
        }
      }
    } catch {
      // Ignore corrupt storage and use fresh seed data.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Storage quota errors do not block UI state.
    }
  }, [store, hydrated]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((tone, title, body) => {
    const id = makeId("toast");
    setToasts((prev) => [...prev, { id, tone, title, body }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

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

  const resetDemoData = useCallback(() => {
    const fresh = createInitialStore();
    setStore(fresh);
    pushToast("info", "Demo workspace reset", "Sample records restored to initial state.");
  }, [pushToast]);

  // ---- Auth Actions ----
  const login = useCallback((email, password) => {
    const normalized = String(email ?? "").trim().toLowerCase();
    const user = store.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user || !password || password.length < 4) {
      return { ok: false, error: "Invalid email or password." };
    }
    if (user.role === "admin" && store.admin2faEnabled && user.twoFactorEnabled) {
      setStore((prev) => ({ ...prev, pending2faUserId: user.id }));
      return { ok: true, requiresTwoFactor: true, user };
    }
    setStore((prev) => ({
      ...prev,
      currentUserId: user.id,
      pending2faUserId: null,
      users: prev.users.map((u) =>
        u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u,
      ),
    }));
    return { ok: true, requiresTwoFactor: false, user };
  }, [store.users, store.admin2faEnabled]);

  const verifyTwoFactor = useCallback((code) => {
    if (!/^\d{6}$/.test(String(code ?? ""))) {
      return { ok: false, error: "Enter the 6-digit verification code." };
    }
    const targetId = store.pending2faUserId ?? store.currentUserId;
    if (!targetId) return { ok: false, error: "No pending sign-in session." };
    setStore((prev) => ({
      ...prev,
      currentUserId: targetId,
      pending2faUserId: null,
    }));
    return { ok: true };
  }, [store.pending2faUserId, store.currentUserId]);

  const register = useCallback(({ name, email }) => {
    const normalized = String(email ?? "").trim().toLowerCase();
    if (!store.registrationOpen) {
      return { ok: false, error: "Registration is currently closed by platform policy." };
    }
    if (store.users.some((u) => u.email.toLowerCase() === normalized)) {
      return { ok: false, fieldErrors: { email: "An account with this email already exists." } };
    }
    const newUser = {
      id: makeId("u"),
      name: name.trim(),
      email: normalized,
      role: "student",
      status: "active",
      rating: null,
      handles: { codeforces: null, leetcode: null },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      attendedCount: 0,
      twoFactorEnabled: false,
    };
    setStore((prev) => ({ ...prev, users: [...prev.users, newUser] }));
    return { ok: true, user: newUser };
  }, [store.registrationOpen, store.users]);

  const logout = useCallback(() => {
    setStore((prev) => ({ ...prev, currentUserId: null, pending2faUserId: null }));
  }, []);

  const switchRoleQuick = useCallback((userId) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return;
    setStore((prev) => ({ ...prev, currentUserId: user.id, pending2faUserId: null }));
  }, [store.users]);

  const updateHandles = useCallback(({ codeforces, leetcode }) => {
    if (!currentUser) return { ok: false, error: "Sign in required." };
    const cf = String(codeforces ?? "").trim() || null;
    const lc = String(leetcode ?? "").trim() || null;
    const fieldErrors = {};
    if (cf && store.users.some((u) => u.id !== currentUser.id && u.handles.codeforces?.toLowerCase() === cf.toLowerCase())) {
      fieldErrors.codeforces = "This Codeforces handle is already linked to another account.";
    }
    if (lc && store.users.some((u) => u.id !== currentUser.id && u.handles.leetcode?.toLowerCase() === lc.toLowerCase())) {
      fieldErrors.leetcode = "This LeetCode handle is already linked to another account.";
    }
    if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

    setStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id ? { ...u, handles: { codeforces: cf, leetcode: lc } } : u,
      ),
      teams: prev.teams.map((t) => ({
        ...t,
        members: t.members.map((m) =>
          m.userId === currentUser.id ? { ...m, handles: { codeforces: cf } } : m,
        ),
      })),
    }));
    pushToast("ok", "Linked handles updated", "Changes saved to your profile.");
    return { ok: true };
  }, [currentUser, store.users, pushToast]);

  // ---- Student Actions ----
  const checkInAttendance = useCallback((lectureId, code) => {
    if (!currentUser) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
    const session = store.attendanceSessions.find((s) => s.lectureId === lectureId && !s.closedAt);
    if (!session) {
      return { ok: false, code: "ATTENDANCE_NOT_ACTIVE", message: "There is no open attendance session for this lecture." };
    }
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      setStore((prev) => ({
        ...prev,
        attendanceSessions: prev.attendanceSessions.map((s) =>
          s.id === session.id ? { ...s, closedAt: new Date().toISOString(), code: null } : s,
        ),
      }));
      return { ok: false, code: "ATTENDANCE_EXPIRED", message: "The attendance session has expired." };
    }
    if (session.records.some((r) => r.userId === currentUser.id)) {
      return { ok: false, code: "ATTENDANCE_DUPLICATE", message: "You have already submitted attendance for this session." };
    }
    if (String(code ?? "").trim() !== session.code) {
      return { ok: false, code: "ATTENDANCE_INVALID_CODE", message: "Invalid attendance code. Check the 4-digit code and try again." };
    }

    const nowIso = new Date().toISOString();
    setStore((prev) => ({
      ...prev,
      attendanceSessions: prev.attendanceSessions.map((s) =>
        s.id === session.id
          ? {
              ...s,
              records: [...s.records, { userId: currentUser.id, name: currentUser.name, submittedAt: nowIso }],
            }
          : s,
      ),
      users: prev.users.map((u) =>
        u.id === currentUser.id ? { ...u, attendedCount: (u.attendedCount ?? 0) + 1 } : u,
      ),
      notifications: [
        {
          id: makeId("notif"),
          userId: currentUser.id,
          type: "attendance_recorded",
          title: "Attendance recorded",
          body: `Attendance recorded for ${session.lectureTitle}.`,
          href: "/attendance",
          createdAt: nowIso,
        },
        ...prev.notifications,
      ],
    }));
    pushToast("ok", "Attendance recorded", session.lectureTitle);
    return { ok: true, submittedAt: nowIso };
  }, [currentUser, store.attendanceSessions, pushToast]);

  const verifyProblem = useCallback((problemId, simulatedOutcome = "auto") => {
    if (!currentUser) return { result: "unlinked" };
    const problem = store.problems.find((p) => p.id === problemId);
    if (!problem) return { result: "failed" };

    const nowIso = new Date().toISOString();
    if (problem.platform === "leetcode" && simulatedOutcome === "auto") {
      setStore((prev) => ({
        ...prev,
        verifications: {
          ...prev.verifications,
          [`${currentUser.id}:${problemId}`]: {
            status: "failed",
            solvedAt: null,
            lastCheckedAt: nowIso,
          },
        },
      }));
      return {
        result: "unavailable",
        message: "LeetCode provisional solve checks are unavailable in v1; no progress awarded.",
      };
    }

    if (!currentUser.handles.codeforces && problem.platform === "codeforces") {
      return { result: "unlinked", message: "Link your Codeforces handle on your profile before running a solve check." };
    }

    const outcome = simulatedOutcome === "auto" ? "solved" : simulatedOutcome;
    setStore((prev) => ({
      ...prev,
      verifications: {
        ...prev.verifications,
        [`${currentUser.id}:${problemId}`]: {
          status: outcome === "solved" ? "solved" : "failed",
          solvedAt: outcome === "solved" ? nowIso : null,
          lastCheckedAt: nowIso,
        },
      },
    }));
    if (outcome === "solved") {
      pushToast("ok", "Provisional solve check passed", `${problem.title} marked solved.`);
    }
    return { result: outcome, solvedAt: outcome === "solved" ? nowIso : null };
  }, [currentUser, store.problems, pushToast]);

  // ---- Team Actions ----
  const createTeam = useCallback((name) => {
    if (!currentUser) return { ok: false, error: "Sign in required." };
    if (currentTeam) return { ok: false, error: "Leave your current team before creating a new one." };
    const trimmed = String(name ?? "").trim();
    if (trimmed.length < 2) return { ok: false, error: "Team name must be at least 2 characters." };
    const slug = slugify(trimmed);
    if (store.teams.some((t) => t.status === "active" && t.slug === slug)) {
      return { ok: false, error: "An active team with a similar name already exists." };
    }
    const team = {
      id: makeId("team"),
      name: trimmed,
      slug,
      inviteCode: randomCode(8, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"),
      captainId: currentUser.id,
      status: "active",
      maxMembers: 5,
      streak: { current: 0, longest: 0 },
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          role: "captain",
          handles: { codeforces: currentUser.handles.codeforces },
          joinedAt: new Date().toISOString(),
        },
      ],
    };
    setStore((prev) => ({ ...prev, teams: [team, ...prev.teams] }));
    pushToast("ok", "Team created", `Invite code: ${team.inviteCode}`);
    return { ok: true, team };
  }, [currentUser, currentTeam, store.teams, pushToast]);

  const joinTeam = useCallback((inviteCode) => {
    if (!currentUser) return { ok: false, error: "Sign in required." };
    if (currentTeam) return { ok: false, error: "You are already on an active team." };
    const normalized = String(inviteCode ?? "").trim().toUpperCase();
    const team = store.teams.find((t) => t.status === "active" && t.inviteCode === normalized);
    if (!team) return { ok: false, error: "No active team found for that invite code." };
    if (team.members.length >= (team.maxMembers ?? 5)) {
      return { ok: false, error: "This team has reached the maximum member limit." };
    }
    setStore((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === team.id
          ? {
              ...t,
              members: [
                ...t.members,
                {
                  userId: currentUser.id,
                  name: currentUser.name,
                  role: "member",
                  handles: { codeforces: currentUser.handles.codeforces },
                  joinedAt: new Date().toISOString(),
                },
              ],
            }
          : t,
      ),
    }));
    pushToast("ok", "Joined team", `Welcome to ${team.name}.`);
    return { ok: true, team };
  }, [currentUser, currentTeam, store.teams, pushToast]);

  const leaveTeam = useCallback(() => {
    if (!currentUser || !currentTeam) return { ok: false, error: "No active team." };
    if (currentTeam.captainId === currentUser.id && currentTeam.members.length > 1) {
      return { ok: false, error: "Transfer captaincy or disband the team before leaving." };
    }
    setStore((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== currentTeam.id) return t;
        const remaining = t.members.filter((m) => m.userId !== currentUser.id);
        return remaining.length === 0
          ? { ...t, members: [], status: "disbanded" }
          : { ...t, members: remaining };
      }),
    }));
    pushToast("info", "Left team", `You left ${currentTeam.name}.`);
    return { ok: true };
  }, [currentUser, currentTeam, pushToast]);

  const removeTeamMember = useCallback((userId) => {
    if (!currentUser || !currentTeam || currentTeam.captainId !== currentUser.id) {
      return { ok: false, error: "Only the team captain can remove members." };
    }
    if (userId === currentUser.id) return { ok: false, error: "Cannot remove yourself." };
    setStore((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === currentTeam.id
          ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
          : t,
      ),
    }));
    pushToast("info", "Member removed");
    return { ok: true };
  }, [currentUser, currentTeam, pushToast]);

  const transferCaptaincy = useCallback((userId) => {
    if (!currentUser || !currentTeam || currentTeam.captainId !== currentUser.id) {
      return { ok: false, error: "Only the team captain can transfer captaincy." };
    }
    if (!currentTeam.members.some((m) => m.userId === userId)) {
      return { ok: false, error: "Selected user is not an active team member." };
    }
    setStore((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === currentTeam.id
          ? {
              ...t,
              captainId: userId,
              members: t.members.map((m) => ({
                ...m,
                role: m.userId === userId ? "captain" : "member",
              })),
            }
          : t,
      ),
    }));
    pushToast("ok", "Captaincy transferred");
    return { ok: true };
  }, [currentUser, currentTeam, pushToast]);

  const disbandTeam = useCallback((teamId) => {
    const id = teamId ?? currentTeam?.id;
    if (!id) return { ok: false, error: "Team not found." };
    const target = store.teams.find((t) => t.id === id);
    setStore((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === id ? { ...t, status: "disbanded", members: [] } : t,
      ),
      auditLogs: currentUser?.role === "admin"
        ? [
            {
              id: makeId("aud"),
              action: "team.disband",
              entityType: "Team",
              entityId: id,
              summary: `Disbanded team ${target?.name ?? id}`,
              actor: { id: currentUser.id, name: currentUser.name },
              createdAt: new Date().toISOString(),
              correlationId: makeId("corr"),
            },
            ...prev.auditLogs,
          ]
        : prev.auditLogs,
    }));
    pushToast("info", "Team disbanded", target?.name);
    return { ok: true };
  }, [currentTeam, currentUser, store.teams, pushToast]);

  // ---- Admin Actions ----
  const appendAudit = useCallback(
    (prev, action, entityType, entityId, summary) => [
      {
        id: makeId("aud"),
        action,
        entityType,
        entityId,
        summary,
        actor: currentUser ? { id: currentUser.id, name: currentUser.name } : { id: "u-marta", name: "Marta Alemu" },
        createdAt: new Date().toISOString(),
        correlationId: makeId("corr"),
      },
      ...prev.auditLogs,
    ],
    [currentUser],
  );

  const reopenUser = useCallback((userId) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return;
    setStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, status: "active", restrictedAt: null, restrictedReason: null } : u,
      ),
      auditLogs: appendAudit(prev, "user.reopen", "User", userId, `Reopened account ${user.name}`),
    }));
    pushToast("ok", "Account access restored", `${user.name} can now access the full platform.`);
  }, [store.users, appendAudit, pushToast]);

  const saveAnnouncement = useCallback((payload) => {
    const nowIso = new Date().toISOString();
    const isEdit = Boolean(payload.id);
    const id = payload.id ?? makeId("ann");
    const status = payload.status === "published" ? "published" : "draft";
    setStore((prev) => {
      const nextItem = {
        id,
        title: payload.title.trim(),
        body: payload.body.trim(),
        type: payload.type,
        status,
        publishedAt: status === "published" ? nowIso : null,
        createdAt: isEdit ? (prev.announcements.find((a) => a.id === id)?.createdAt ?? nowIso) : nowIso,
        updatedAt: nowIso,
        createdBy: currentUser?.name ?? "Marta Alemu",
        relatedHref: null,
      };
      const announcements = isEdit
        ? prev.announcements.map((a) => (a.id === id ? { ...a, ...nextItem } : a))
        : [nextItem, ...prev.announcements];
      return {
        ...prev,
        announcements,
        auditLogs: appendAudit(
          prev,
          status === "published" ? "announcement.publish" : "announcement.manage",
          "Announcement",
          id,
          `${status === "published" ? "Published" : "Saved"} announcement ${nextItem.title}`,
        ),
      };
    });
    pushToast("ok", status === "published" ? "Announcement published successfully" : "Announcement draft saved");
  }, [appendAudit, currentUser?.name, pushToast]);

  const publishAnnouncement = useCallback((id) => {
    const item = store.announcements.find((a) => a.id === id);
    if (!item) return;
    const nowIso = new Date().toISOString();
    setStore((prev) => ({
      ...prev,
      announcements: prev.announcements.map((a) =>
        a.id === id ? { ...a, status: "published", publishedAt: nowIso, updatedAt: nowIso } : a,
      ),
      auditLogs: appendAudit(prev, "announcement.publish", "Announcement", id, `Published announcement ${item.title}`),
    }));
    pushToast("ok", "Announcement published successfully");
  }, [store.announcements, appendAudit, pushToast]);

  const deleteAnnouncement = useCallback((id) => {
    const item = store.announcements.find((a) => a.id === id);
    setStore((prev) => ({
      ...prev,
      announcements: prev.announcements.filter((a) => a.id !== id),
      auditLogs: appendAudit(prev, "announcement.delete", "Announcement", id, `Deleted announcement ${item?.title ?? id}`),
    }));
    pushToast("ok", "Announcement deleted");
  }, [store.announcements, appendAudit, pushToast]);

  const saveLecture = useCallback((payload) => {
    const id = payload.id ?? makeId("lec");
    const isEdit = Boolean(payload.id);
    const status = payload.status === "published" ? "published" : "draft";
    setStore((prev) => {
      const nextLecture = {
        id,
        title: payload.title.trim(),
        description: payload.description.trim(),
        scheduledAt: payload.scheduledAt,
        liveUrl: payload.liveUrl?.trim() || null,
        status,
        state: status === "published" ? "Upcoming" : "Draft",
        resources: payload.resources ?? [],
      };
      const lectures = isEdit
        ? prev.lectures.map((l) => (l.id === id ? { ...l, ...nextLecture } : l))
        : [nextLecture, ...prev.lectures];
      return {
        ...prev,
        lectures,
        auditLogs: appendAudit(
          prev,
          status === "published" ? "lecture.publish" : "lecture.manage",
          "Lecture",
          id,
          `${status === "published" ? "Published" : "Saved"} lecture ${nextLecture.title}`,
        ),
      };
    });
    pushToast("ok", status === "published" ? "Lecture published" : "Lecture saved as draft");
  }, [appendAudit, pushToast]);

  const deleteLecture = useCallback((id) => {
    const hasOpen = store.attendanceSessions.some((s) => s.lectureId === id && !s.closedAt);
    if (hasOpen) {
      pushToast("bad", "Cannot delete lecture", "Close the open attendance session before deleting this lecture.");
      return { ok: false, error: "Close the open attendance session first." };
    }
    const lec = store.lectures.find((l) => l.id === id);
    setStore((prev) => ({
      ...prev,
      lectures: prev.lectures.filter((l) => l.id !== id),
      auditLogs: appendAudit(prev, "lecture.delete", "Lecture", id, `Deleted lecture ${lec?.title ?? id}`),
    }));
    pushToast("ok", "Lecture deleted");
    return { ok: true };
  }, [store.attendanceSessions, store.lectures, appendAudit, pushToast]);

  const startAttendanceSession = useCallback((lectureId, validSeconds = 600) => {
    const lec = store.lectures.find((l) => l.id === lectureId);
    if (!lec) return { ok: false, error: "Lecture not found." };
    const existingOpen = store.attendanceSessions.find((s) => s.lectureId === lectureId && !s.closedAt);
    if (existingOpen && new Date(existingOpen.expiresAt).getTime() > Date.now()) {
      return { ok: false, error: "An active attendance session is already open for this lecture." };
    }
    const now = Date.now();
    const session = {
      id: makeId("att-sess"),
      lectureId,
      lectureTitle: lec.title,
      opensAt: new Date(now).toISOString(),
      expiresAt: new Date(now + validSeconds * 1000).toISOString(),
      closedAt: null,
      code: randomCode(4, "0123456789"),
      records: [],
    };
    setStore((prev) => ({
      ...prev,
      attendanceSessions: [
        session,
        ...prev.attendanceSessions.map((s) =>
          s.lectureId === lectureId && !s.closedAt
            ? { ...s, closedAt: new Date(now).toISOString(), code: null }
            : s,
        ),
      ],
      auditLogs: appendAudit(prev, "attendance.start", "AttendanceSession", session.id, `Started attendance session for ${lec.title}`),
    }));
    pushToast("ok", "Attendance session started", `Code: ${session.code}`);
    return { ok: true, session };
  }, [store.lectures, store.attendanceSessions, appendAudit, pushToast]);

  const closeAttendanceSession = useCallback((sessionId) => {
    const sess = store.attendanceSessions.find((s) => s.id === sessionId);
    if (!sess) return;
    setStore((prev) => ({
      ...prev,
      attendanceSessions: prev.attendanceSessions.map((s) =>
        s.id === sessionId ? { ...s, closedAt: new Date().toISOString(), code: null } : s,
      ),
      auditLogs: appendAudit(prev, "attendance.close", "AttendanceSession", sessionId, `Closed attendance session for ${sess.lectureTitle}`),
    }));
    pushToast("info", "Attendance session closed");
  }, [store.attendanceSessions, appendAudit, pushToast]);

  const saveContest = useCallback((payload) => {
    const id = payload.id ?? makeId("con");
    const isEdit = Boolean(payload.id);
    const publication = payload.publication === "published" ? "published" : "draft";
    setStore((prev) => {
      const existing = prev.contests.find((c) => c.id === id);
      const next = {
        id,
        title: payload.title.trim(),
        description: payload.description.trim(),
        mode: payload.mode === "team" ? "team" : "individual",
        platform: "codeforces",
        platformContestId: String(payload.platformContestId).trim(),
        url: payload.url.trim(),
        invitationUrl: payload.invitationUrl?.trim() || null,
        startsAt: payload.startsAt,
        durationMinutes: Number(payload.durationMinutes) || (payload.mode === "team" ? 10080 : 120),
        status: payload.status ?? "upcoming",
        publication,
        resultsState: existing?.resultsState ?? "not_fetched",
        lastFetchedAt: existing?.lastFetchedAt ?? null,
        fetchSummary: existing?.fetchSummary ?? null,
      };
      const contests = isEdit
        ? prev.contests.map((c) => (c.id === id ? next : c))
        : [next, ...prev.contests];
      return {
        ...prev,
        contests,
        auditLogs: appendAudit(
          prev,
          publication === "published" ? "contest.publish" : "contest.manage",
          "Contest",
          id,
          `${publication === "published" ? "Published" : "Saved"} contest ${next.title}`,
        ),
      };
    });
    pushToast("ok", publication === "published" ? "Contest published" : "Contest draft saved");
  }, [appendAudit, pushToast]);

  const deleteContest = useCallback((id) => {
    const c = store.contests.find((x) => x.id === id);
    setStore((prev) => ({
      ...prev,
      contests: prev.contests.filter((x) => x.id !== id),
      auditLogs: appendAudit(prev, "contest.delete", "Contest", id, `Deleted contest ${c?.title ?? id}`),
    }));
    pushToast("ok", "Contest deleted");
  }, [store.contests, appendAudit, pushToast]);

  const fetchContestResults = useCallback((contestId, simulateError = false) => {
    const contest = store.contests.find((c) => c.id === contestId);
    if (!contest) return { ok: false, error: "Contest not found." };
    if (contest.resultsState === "published") {
      return { ok: false, error: "Published results cannot be overwritten." };
    }
    if (simulateError) {
      return { ok: false, error: "Unable to fetch Codeforces standings. Check the contest ID and try again." };
    }
    const nowIso = new Date().toISOString();
    const generatedRows = [
      { userId: "u-hana", teamId: "team-1", rank: 1, name: "Hana Tesfaye", handle: "hana_t", points: 1320, penalty: 185 },
      { userId: "u-ibrahim", teamId: "team-1", rank: 2, name: "Ibrahim Kedir", handle: "ibrahimkediramdela2211", points: 1180, penalty: 310 },
      { userId: "u-yonas", teamId: "team-1", rank: 3, name: "Yonas Alemu", handle: "yonas_a", points: 1090, penalty: 400 },
      { userId: "u-dawit", teamId: "team-2", rank: 4, name: "Dawit Haile", handle: "dawit_h", points: 960, penalty: 520 },
      { userId: "u-sara", teamId: "team-2", rank: 5, name: "Sara Mohammed", handle: "sara_m", points: 890, penalty: 610 },
    ];
    const generatedTeams = contest.mode === "team"
      ? [
          { teamId: "team-1", teamName: "Binary Hawks", rank: 1, points: 3590, penalty: 895, memberCount: 4, matchedMembers: 3 },
          { teamId: "team-2", teamName: "Stack Overflowers", rank: 2, points: 1850, penalty: 1130, memberCount: 2, matchedMembers: 2 },
        ]
      : [];
    const summary = {
      processed: 12,
      matched: generatedRows.length,
      unmatchedHandles: ["tourist_x", "new_handle_22", "guest_904"],
      teamsMatched: contest.mode === "team" ? generatedTeams.length : undefined,
    };

    setStore((prev) => ({
      ...prev,
      contests: prev.contests.map((c) =>
        c.id === contestId
          ? { ...c, resultsState: "fetched", lastFetchedAt: nowIso, fetchSummary: summary }
          : c,
      ),
      contestResults: { ...prev.contestResults, [contestId]: generatedRows },
      teamContestResults: contest.mode === "team"
        ? { ...prev.teamContestResults, [contestId]: generatedTeams }
        : prev.teamContestResults,
      auditLogs: appendAudit(prev, "results.fetch", "Contest", contestId, `Fetched Codeforces standings for ${contest.title}`),
    }));
    pushToast("ok", "Results fetched successfully", `${summary.matched} participants matched.`);
    return { ok: true, summary };
  }, [store.contests, appendAudit, pushToast]);

  const publishContestResults = useCallback((contestId) => {
    const contest = store.contests.find((c) => c.id === contestId);
    if (!contest || contest.resultsState !== "fetched") {
      return { ok: false, error: "Fetch results before publishing." };
    }
    setStore((prev) => ({
      ...prev,
      contests: prev.contests.map((c) =>
        c.id === contestId ? { ...c, resultsState: "published", status: "completed" } : c,
      ),
      auditLogs: appendAudit(prev, "results.publish", "Contest", contestId, `Published results for ${contest.title}`),
    }));
    pushToast("ok", "Results published", `${contest.title} standings are now visible to students.`);
    return { ok: true };
  }, [store.contests, appendAudit, pushToast]);

  const saveTopic = useCallback((payload) => {
    const id = payload.id ?? slugify(payload.name);
    const isEdit = Boolean(payload.id);
    const slug = slugify(payload.slug || payload.name);
    if (!isEdit && store.topics.some((t) => t.slug === slug)) {
      return { ok: false, error: "A topic with this slug already exists." };
    }
    setStore((prev) => {
      const next = { id, name: payload.name.trim(), slug, order: Number(payload.order) || prev.topics.length + 1 };
      const topics = isEdit ? prev.topics.map((t) => (t.id === id ? next : t)) : [...prev.topics, next];
      return {
        ...prev,
        topics,
        auditLogs: appendAudit(prev, "topics.manage", "Topic", id, `${isEdit ? "Updated" : "Created"} topic ${next.name}`),
      };
    });
    pushToast("ok", isEdit ? "Topic updated" : "Topic created");
    return { ok: true };
  }, [store.topics, appendAudit, pushToast]);

  const deleteTopic = useCallback((id) => {
    const hasProblems = store.problems.some((p) => p.topicId === id);
    if (hasProblems) {
      pushToast("bad", "Cannot delete topic", "Remove or reassign problems in this topic before deleting it.");
      return { ok: false, error: "Topic still has problems." };
    }
    const topic = store.topics.find((t) => t.id === id);
    setStore((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.id !== id),
      auditLogs: appendAudit(prev, "topics.delete", "Topic", id, `Deleted topic ${topic?.name ?? id}`),
    }));
    pushToast("ok", "Topic deleted");
    return { ok: true };
  }, [store.problems, store.topics, appendAudit, pushToast]);

  const saveProblem = useCallback((payload) => {
    const id = payload.id ?? makeId("p");
    const isEdit = Boolean(payload.id);
    setStore((prev) => {
      const next = {
        id,
        title: payload.title.trim(),
        topicId: payload.topicId,
        platform: payload.platform,
        value: payload.value ? Number(payload.value) : null,
        url: payload.url.trim(),
        externalRef: payload.platform === "codeforces"
          ? { contestId: Number(payload.contestId) || 1, index: payload.index || "A" }
          : { titleSlug: payload.titleSlug || slugify(payload.title) },
        status: payload.status === "published" ? "published" : "draft",
      };
      const problems = isEdit ? prev.problems.map((p) => (p.id === id ? next : p)) : [next, ...prev.problems];
      return {
        ...prev,
        problems,
        auditLogs: appendAudit(prev, "problems.manage", "Problem", id, `${isEdit ? "Updated" : "Added"} problem ${next.title}`),
      };
    });
    pushToast("ok", isEdit ? "Problem updated" : "Problem added");
  }, [appendAudit, pushToast]);

  const deleteProblem = useCallback((id) => {
    const prob = store.problems.find((p) => p.id === id);
    setStore((prev) => ({
      ...prev,
      problems: prev.problems.filter((p) => p.id !== id),
      auditLogs: appendAudit(prev, "problems.delete", "Problem", id, `Deleted problem ${prob?.title ?? id}`),
    }));
    pushToast("ok", "Problem deleted");
  }, [store.problems, appendAudit, pushToast]);

  const enrollTwoFactor = useCallback((code) => {
    if (!/^\d{6}$/.test(String(code ?? ""))) {
      return { ok: false, error: "Invalid verification code. Enter the 6 digits from your authenticator." };
    }
    setStore((prev) => ({
      ...prev,
      admin2faEnabled: true,
      users: prev.users.map((u) =>
        u.id === prev.currentUserId ? { ...u, twoFactorEnabled: true } : u,
      ),
      auditLogs: appendAudit(prev, "twofa.enroll", "User", prev.currentUserId ?? "u-marta", "Enrolled admin two-factor authentication"),
    }));
    pushToast("ok", "Two-factor authentication enabled");
    return { ok: true };
  }, [appendAudit, pushToast]);

  const value = useMemo(
    () => ({
      store,
      hydrated,
      currentUser,
      currentTeam,
      pushToast,
      resetDemoData,
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
      enrollTwoFactor,
    }),
    [
      store,
      hydrated,
      currentUser,
      currentTeam,
      pushToast,
      resetDemoData,
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
