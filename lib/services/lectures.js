import { getEnv, isProduction } from "@/lib/config/env.js";
import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { AttendanceRecord } from "@/models/AttendanceRecord.js";
import { AttendanceSession } from "@/models/AttendanceSession.js";
import { Lecture } from "@/models/Lecture.js";

/**
 * Validates external resource or meeting URLs (B13).
 */
export function isValidResourceUrl(raw) {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 1000) return false;
  try {
    const u = new URL(trimmed);
    if (u.username || u.password) return false;
    if (isProduction()) {
      return u.protocol === "https:";
    }
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Lecture state is OPEN (B12): returns null until NCC fixes transitions.
 */
export function deriveLectureState(_lecture, _now) {
  return null;
}

export function toLectureDto(doc, { now = new Date(), attendance = null, includeStatus = false } = {}) {
  const dto = {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? "",
    scheduledAt: new Date(doc.scheduledAt).toISOString(),
    liveUrl: doc.liveUrl ?? null,
    resources: (doc.resources ?? []).map((r) => ({
      title: r.title,
      type: r.type,
      url: r.url,
    })),
    state: deriveLectureState(doc, now),
    attendance: attendance ?? { sessionOpen: false, checkedIn: false },
  };
  if (includeStatus) {
    dto.status = doc.status;
  }
  return dto;
}

async function attachStudentAttendance(lectures, userId, now) {
  if (!lectures.length) return [];
  const attendanceConfigOk = Boolean(getEnv().attendance);
  if (!attendanceConfigOk) {
    return lectures.map((lec) => toLectureDto(lec, { now, attendance: undefined }));
  }

  const lectureIds = lectures.map((l) => l._id);
  const openSessions = await AttendanceSession.find({
    lectureId: { $in: lectureIds },
    closedAt: null,
    expiresAt: { $gt: now },
  }).lean();

  const sessionIds = openSessions.map((s) => s._id);
  const myRecords = sessionIds.length && userId
    ? await AttendanceRecord.find({ sessionId: { $in: sessionIds }, userId }).lean()
    : [];

  const openByLecture = new Map(openSessions.map((s) => [String(s.lectureId), s]));
  const checkedSet = new Set(myRecords.map((r) => String(r.sessionId)));

  return lectures.map((lec) => {
    const open = openByLecture.get(String(lec._id));
    const attendance = {
      sessionOpen: Boolean(open),
      checkedIn: open ? checkedSet.has(String(open._id)) : false,
    };
    return toLectureDto(lec, { now, attendance });
  });
}

export async function listLectures(ctx, { page = 1, limit = 20 } = {}) {
  await connectDb();
  const filter = { status: "published", deletedAt: null };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Lecture.find(filter).sort({ scheduledAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Lecture.countDocuments(filter),
  ]);
  const items = await attachStudentAttendance(rows, ctx.actor?.id, ctx.now);
  return paginated(items, total, { page, limit });
}

export async function getLecture(ctx, id) {
  await connectDb();
  const doc = await Lecture.findOne({ _id: id, status: "published", deletedAt: null }).lean();
  if (!doc) throw new AppError("NOT_FOUND");
  const [dto] = await attachStudentAttendance([doc], ctx.actor?.id, ctx.now);
  return dto;
}

export async function listAdminLectures(ctx, { page = 1, limit = 20 } = {}) {
  await connectDb();
  const filter = { deletedAt: null };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Lecture.find(filter).sort({ scheduledAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Lecture.countDocuments(filter),
  ]);
  return paginated(
    rows.map((l) => toLectureDto(l, { now: ctx.now, includeStatus: true })),
    total,
    { page, limit },
  );
}

export async function getAdminLecture(ctx, id) {
  await connectDb();
  const doc = await Lecture.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) throw new AppError("NOT_FOUND");
  return toLectureDto(doc, { now: ctx.now, includeStatus: true });
}

function assertValidLectureUrls({ liveUrl, resources }) {
  const fields = {};
  if (liveUrl !== undefined && liveUrl !== null && String(liveUrl).trim() !== "") {
    if (!isValidResourceUrl(liveUrl)) {
      fields.liveUrl = "Provide a valid external URL without embedded credentials.";
    }
  }
  if (Array.isArray(resources)) {
    for (let i = 0; i < resources.length; i += 1) {
      if (!isValidResourceUrl(resources[i]?.url)) {
        fields[`resources.${i}.url`] = "Provide a valid resource URL without embedded credentials.";
        break;
      }
    }
  }
  if (Object.keys(fields).length) {
    throw new AppError("VALIDATION_ERROR", { fields });
  }
}

export async function createLecture(ctx, { title, description, scheduledAt, liveUrl, resources }) {
  assertValidLectureUrls({ liveUrl, resources });
  return runInTransaction(async (dbSession) => {
    const [created] = await Lecture.create(
      [
        {
          title: String(title).trim(),
          description: String(description ?? "").trim(),
          scheduledAt: new Date(scheduledAt),
          liveUrl: liveUrl ? String(liveUrl).trim() : null,
          status: "draft",
          resources: resources ?? [],
          deletedAt: null,
        },
      ],
      { session: dbSession },
    );

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.LECTURE_CREATE,
      entityType: "Lecture",
      entityId: created._id,
      summary: `Created lecture ${created.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toLectureDto(created.toObject(), { now: ctx.now, includeStatus: true });
  });
}

export async function updateLecture(ctx, id, patch) {
  assertValidLectureUrls({ liveUrl: patch.liveUrl, resources: patch.resources });
  return runInTransaction(async (dbSession) => {
    const doc = await Lecture.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    if (patch.title !== undefined) doc.title = String(patch.title).trim();
    if (patch.description !== undefined) doc.description = String(patch.description ?? "").trim();
    if (patch.scheduledAt !== undefined) doc.scheduledAt = new Date(patch.scheduledAt);
    if (patch.liveUrl !== undefined) doc.liveUrl = patch.liveUrl ? String(patch.liveUrl).trim() : null;
    if (patch.resources !== undefined) doc.resources = patch.resources;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.LECTURE_UPDATE,
      entityType: "Lecture",
      entityId: doc._id,
      summary: `Updated lecture ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toLectureDto(doc.toObject(), { now: ctx.now, includeStatus: true });
  });
}

export async function publishLecture(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Lecture.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    if (doc.status === "published") {
      throw new AppError("INVALID_STATE", { message: "Lecture is already published." });
    }
    doc.status = "published";
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.LECTURE_PUBLISH,
      entityType: "Lecture",
      entityId: doc._id,
      summary: `Published lecture ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toLectureDto(doc.toObject(), { now: ctx.now, includeStatus: true });
  });
}

export async function deleteLecture(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Lecture.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    // Lead decision A2: refuse delete while ANY session of the lecture has closedAt: null (expired or not).
    const openSession = await AttendanceSession.exists({ lectureId: doc._id, closedAt: null }).session(dbSession);
    if (openSession) {
      throw new AppError("INVALID_STATE", {
        message: "Close the open attendance session before deleting this lecture.",
      });
    }

    doc.deletedAt = ctx.now;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.LECTURE_DELETE,
      entityType: "Lecture",
      entityId: doc._id,
      summary: `Deleted lecture ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return { id: String(doc._id) };
  });
}
