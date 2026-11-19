export const PUBLIC_ROUTES = Object.freeze([
  Object.freeze({
    method: "POST",
    path: "/api/auth/register",
    reason: "No account exists yet (policy gated by REGISTRATION_MODE, B3)",
  }),
  Object.freeze({
    method: "POST",
    path: "/api/auth/login",
    reason: "No session exists yet",
  }),
]);

export const ROLE_PERMISSIONS = Object.freeze({
  student: Object.freeze([
    "auth.me",
    "auth.logout",
    "profile.handles.update",
    "dashboard.read",
    "announcements.read",
    "notifications.read",
    "lectures.read",
    "attendance.checkin",
    "attendance.read",
    "progress.read",
    "problems.read",
    "problems.check",
    "contests.read",
    "results.read",
    "rating.read",
    "streak.read",
    "teams.read",
    "teams.manage",
  ]),
  admin: Object.freeze([
    "auth.me",
    "auth.logout",
    "auth.2fa.verify",
    "admin.dashboard.read",
    "users.read",
    "auditlog.read",
    "users.restrict",
    "users.reopen",
    "announcements.manage",
    "announcements.publish",
    "announcements.delete",
    "lectures.manage",
    "lectures.publish",
    "lectures.delete",
    "attendance.manage",
    "attendance.admin.read",
    "topics.manage",
    "topics.delete",
    "problems.manage",
    "problems.publish",
    "problems.delete",
    "contests.manage",
    "contests.publish",
    "contests.delete",
    "results.fetch",
    "results.publish",
    "teams.admin.read",
    "teams.admin.manage",
    "rating.admin.read",
    "rating.recalculate",
    "progress.admin.read",
    "twofa.enroll",
  ]),
});

export const ALL_CATALOG_PERMISSIONS = Object.freeze(
  [...new Set([...ROLE_PERMISSIONS.student, ...ROLE_PERMISSIONS.admin])],
);

export function can(role, permission) {
  if (!role || !Object.hasOwn(ROLE_PERMISSIONS, role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isPublicRoute(method, path) {
  return PUBLIC_ROUTES.some((r) => r.method === method && r.path === path);
}
