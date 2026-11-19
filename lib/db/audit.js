import { AuditLog } from "@/models/AuditLog.js";
import { connectDb } from "./connect.js";
import { paginated } from "@/lib/http/pagination.js";

export const AUDIT_ACTIONS = Object.freeze({
  USER_RESTRICT: "user.restrict",
  USER_REOPEN: "user.reopen",
  USER_ROLE_CHANGE: "user.role_change",
  ANNOUNCEMENT_CREATE: "announcement.create",
  ANNOUNCEMENT_UPDATE: "announcement.update",
  ANNOUNCEMENT_PUBLISH: "announcement.publish",
  ANNOUNCEMENT_DELETE: "announcement.delete",
  LECTURE_CREATE: "lecture.create",
  LECTURE_UPDATE: "lecture.update",
  LECTURE_PUBLISH: "lecture.publish",
  LECTURE_DELETE: "lecture.delete",
  ATTENDANCE_START: "attendance.start",
  ATTENDANCE_CLOSE: "attendance.close",
  CONTEST_CREATE: "contest.create",
  CONTEST_UPDATE: "contest.update",
  CONTEST_PUBLISH: "contest.publish",
  CONTEST_DELETE: "contest.delete",
  RESULTS_FETCH: "results.fetch",
  RESULTS_PUBLISH: "results.publish",
  TOPIC_CREATE: "topic.create",
  TOPIC_UPDATE: "topic.update",
  TOPIC_DELETE: "topic.delete",
  PROBLEM_CREATE: "problem.create",
  PROBLEM_UPDATE: "problem.update",
  PROBLEM_PUBLISH: "problem.publish",
  PROBLEM_DELETE: "problem.delete",
  TEAM_DISBAND: "team.disband",
  TWOFA_ENROLL: "twofa.enroll",
});

export const ADMIN_NOTIFICATION_ACTIONS = Object.freeze([
  AUDIT_ACTIONS.ANNOUNCEMENT_PUBLISH,
  AUDIT_ACTIONS.LECTURE_PUBLISH,
  AUDIT_ACTIONS.CONTEST_PUBLISH,
  AUDIT_ACTIONS.RESULTS_PUBLISH,
  AUDIT_ACTIONS.USER_RESTRICT,
  AUDIT_ACTIONS.USER_REOPEN,
]);

export function toAuditEntryDto(doc) {
  const actorDoc = doc.actorId && typeof doc.actorId === "object" && doc.actorId.name ? doc.actorId : null;
  return {
    id: String(doc._id),
    action: doc.action,
    entityType: doc.entityType,
    entityId: doc.entityId ? String(doc.entityId) : null,
    summary: doc.summary,
    actor: actorDoc ? { id: String(actorDoc._id), name: actorDoc.name } : null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

/**
 * Append-only audit log writer. Participates in the caller's MongoDB transaction when `session` is provided.
 */
export async function audit({
  actorId = null,
  action,
  entityType,
  entityId = null,
  summary,
  meta = null,
  correlationId = "system",
  session = null,
}) {
  await connectDb();
  const payload = {
    actorId: actorId || null,
    action,
    entityType,
    entityId: entityId || null,
    summary: String(summary).slice(0, 500),
    meta: meta ?? null,
    correlationId: String(correlationId || "system"),
  };
  if (session) {
    const [created] = await AuditLog.create([payload], { session });
    return created;
  }
  return AuditLog.create(payload);
}

/**
 * Lists audit entries newest-first without ever selecting `meta`.
 */
export async function listAuditEntries({ page = 1, limit = 20, actions = null } = {}) {
  await connectDb();
  const filter = actions && actions.length ? { action: { $in: actions } } : {};
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    AuditLog.find(filter)
      .select("-meta")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "actorId", select: "name" })
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return paginated(rows.map(toAuditEntryDto), total, { page, limit });
}
