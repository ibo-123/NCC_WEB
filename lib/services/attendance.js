import crypto from "node:crypto";
import mongoose from "mongoose";
import { assertConfigReady } from "@/lib/config/env.js";
import { ACTIVITY_TYPES, recordActivity } from "@/lib/db/activity.js";
import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { NOTIFICATION_TYPES, notify } from "@/lib/db/notifications.js";
import { isDuplicateKeyError, runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { AEAD_PURPOSES, decrypt, encrypt } from "@/lib/security/aead.js";
import {
  RATE_LIMIT_SCOPES,
  checkRateLimit,
  consumeRateLimit,
} from "@/lib/security/rateLimit.js";
import { AttendanceRecord } from "@/models/AttendanceRecord.js";
import { AttendanceSession } from "@/models/AttendanceSession.js";
import { Lecture } from "@/models/Lecture.js";

function toAdminSessionDto(sess, { code = null, lectureTitle = null, recordCount = null } = {}) {
  const dto = {
    id: String(sess._id),
    lectureId: String(sess.lectureId),
    opensAt: new Date(sess.opensAt).toISOString(),
    expiresAt: new Date(sess.expiresAt).toISOString(),
    closedAt: sess.closedAt ? new Date(sess.closedAt).toISOString() : null,
    code,
  };
  if (lectureTitle !== null) dto.lectureTitle = lectureTitle;
  if (recordCount !== null) dto.recordCount = recordCount;
  return dto;
}

function constantTimeCodeEqual(submitted, expected) {
  const a = Buffer.from(String(submitted ?? ""), "utf8");
  const b = Buffer.from(String(expected ?? ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Lazy closure (Lead A1): sets closedAt to server time and clears codeEnc when expired.
 */
export async function closeIfExpired(sessionDoc, now = new Date(), dbSession = null) {
  if (!sessionDoc || sessionDoc.closedAt !== null) return false;
  if (new Date(sessionDoc.expiresAt) > now) return false;
  await AttendanceSession.updateOne(
    { _id: sessionDoc._id, closedAt: null },
    { $set: { closedAt: now, codeEnc: null } },
    dbSession ? { session: dbSession } : {},
  );
  return true;
}

export async function startAttendance(ctx, lectureId, { validForSeconds } = {}) {
  const attConfig = assertConfigReady("attendance");
  const ttlSeconds = validForSeconds ?? attConfig.defaultValidSeconds;

  return runInTransaction(async (dbSession) => {
    const lecture = await Lecture.findOne({ _id: lectureId, deletedAt: null }).session(dbSession);
    if (!lecture) throw new AppError("NOT_FOUND");

    const openSession = await AttendanceSession.findOne({
      lectureId: lecture._id,
      closedAt: null,
    }).session(dbSession);

    if (openSession) {
      if (new Date(openSession.expiresAt) > ctx.now) {
        throw new AppError("INVALID_STATE", {
          message: "An active attendance session is already open for this lecture.",
        });
      }
      // Lead A1: lazily close expired open session before opening the next one.
      await AttendanceSession.updateOne(
        { _id: openSession._id, closedAt: null },
        { $set: { closedAt: ctx.now, codeEnc: null } },
        { session: dbSession },
      );
    }

    const sessionId = new mongoose.Types.ObjectId();
    const plainCode = String(crypto.randomInt(0, 10000)).padStart(4, "0");
    const codeEnc = encrypt(AEAD_PURPOSES.ATTENDANCE_CODE, String(sessionId), plainCode);
    const expiresAt = new Date(ctx.now.getTime() + ttlSeconds * 1000);

    const [created] = await AttendanceSession.create(
      [
        {
          _id: sessionId,
          lectureId: lecture._id,
          codeEnc,
          openedBy: ctx.actor.id,
          opensAt: ctx.now,
          expiresAt,
          closedAt: null,
        },
      ],
      { session: dbSession },
    );

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.ATTENDANCE_START,
      entityType: "AttendanceSession",
      entityId: created._id,
      summary: `Started attendance session for ${lecture.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toAdminSessionDto(created.toObject(), {
      code: plainCode,
      lectureTitle: lecture.title,
      recordCount: 0,
    });
  });
}

export async function closeAttendance(ctx, sessionId) {
  return runInTransaction(async (dbSession) => {
    const sess = await AttendanceSession.findById(sessionId).session(dbSession);
    if (!sess) throw new AppError("NOT_FOUND");
    if (sess.closedAt !== null) {
      throw new AppError("INVALID_STATE", {
        message: "Attendance session is already closed.",
      });
    }

    sess.closedAt = ctx.now;
    sess.codeEnc = null;
    await sess.save({ session: dbSession });

    const lecture = await Lecture.findById(sess.lectureId).select("title").session(dbSession).lean();

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.ATTENDANCE_CLOSE,
      entityType: "AttendanceSession",
      entityId: sess._id,
      summary: `Closed attendance session for ${lecture?.title ?? String(sess.lectureId)}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toAdminSessionDto(sess.toObject(), {
      code: null,
      lectureTitle: lecture?.title ?? null,
    });
  });
}

export async function checkIn(ctx, lectureId, submittedCode, { clientIp = "127.0.0.1" } = {}) {
  assertConfigReady("attendance");
  await connectDb();

  const lecture = await Lecture.findOne({
    _id: lectureId,
    status: "published",
    deletedAt: null,
  }).lean();
  if (!lecture) throw new AppError("NOT_FOUND");

  const sess = await AttendanceSession.findOne({
    lectureId: lecture._id,
    closedAt: null,
  })
    .select("+codeEnc")
    .lean();

  if (!sess) {
    throw new AppError("ATTENDANCE_NOT_ACTIVE");
  }

  // Lead A1: lazy closure committed even though response is ATTENDANCE_EXPIRED.
  if (new Date(sess.expiresAt) <= ctx.now) {
    await runInTransaction(async (dbSession) => {
      await closeIfExpired(sess, ctx.now, dbSession);
    });
    throw new AppError("ATTENDANCE_EXPIRED");
  }

  const sessionStudentKey = `${String(sess._id)}:${String(ctx.actor.id)}`;
  const sessionKey = String(sess._id);
  const ipKey = clientIp || "127.0.0.1";

  const [studentCheck, sessionCheck, ipCheck] = await Promise.all([
    checkRateLimit(RATE_LIMIT_SCOPES.ATTENDANCE, sessionStudentKey, { now: ctx.now }),
    checkRateLimit(RATE_LIMIT_SCOPES.ATTENDANCE_SESSION, sessionKey, { now: ctx.now }),
    checkRateLimit(RATE_LIMIT_SCOPES.ATTENDANCE_IP, ipKey, { now: ctx.now }),
  ]);

  if (!studentCheck.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: studentCheck.retryAfterSeconds });
  }
  if (!sessionCheck.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: sessionCheck.retryAfterSeconds });
  }
  if (!ipCheck.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: ipCheck.retryAfterSeconds });
  }

  const existingRecord = await AttendanceRecord.exists({
    sessionId: sess._id,
    userId: ctx.actor.id,
  });
  if (existingRecord) {
    throw new AppError("ATTENDANCE_DUPLICATE");
  }

  const expectedCode = decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, String(sess._id), sess.codeEnc);
  const matches = constantTimeCodeEqual(submittedCode, expectedCode);

  if (!matches) {
    const [rStudent, rSess, rIp] = await Promise.all([
      consumeRateLimit(RATE_LIMIT_SCOPES.ATTENDANCE, sessionStudentKey, { now: ctx.now }),
      consumeRateLimit(RATE_LIMIT_SCOPES.ATTENDANCE_SESSION, sessionKey, { now: ctx.now }),
      consumeRateLimit(RATE_LIMIT_SCOPES.ATTENDANCE_IP, ipKey, { now: ctx.now }),
    ]);
    if (!rStudent.allowed || rStudent.lockedOutNow) {
      throw new AppError("RATE_LIMITED", { retryAfterSeconds: rStudent.retryAfterSeconds });
    }
    if (!rSess.allowed) {
      throw new AppError("RATE_LIMITED", { retryAfterSeconds: rSess.retryAfterSeconds });
    }
    if (!rIp.allowed) {
      throw new AppError("RATE_LIMITED", { retryAfterSeconds: rIp.retryAfterSeconds });
    }
    throw new AppError("ATTENDANCE_INVALID_CODE", {
      message: "Invalid attendance code. Check the 4-digit code and try again.",
    });
  }

  try {
    await runInTransaction(async (dbSession) => {
      await AttendanceRecord.create(
        [
          {
            sessionId: sess._id,
            lectureId: lecture._id,
            userId: ctx.actor.id,
            submittedAt: ctx.now,
          },
        ],
        { session: dbSession },
      );

      await recordActivity({
        userId: ctx.actor.id,
        type: ACTIVITY_TYPES.ATTENDANCE,
        refId: sess._id,
        occurredAt: ctx.now,
        session: dbSession,
      });

      await notify({
        userIds: [ctx.actor.id],
        type: NOTIFICATION_TYPES.ATTENDANCE_RECORDED,
        title: "Attendance recorded",
        body: `Attendance recorded for ${lecture.title}.`,
        href: "/attendance",
        session: dbSession,
      });
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError("ATTENDANCE_DUPLICATE");
    }
    throw err;
  }

  return {
    record: {
      lectureId: String(lecture._id),
      submittedAt: ctx.now.toISOString(),
    },
  };
}

export async function listAttendanceSessions(ctx, { page = 1, limit = 20, lectureId } = {}) {
  assertConfigReady("attendance");
  await connectDb();

  const filter = {};
  if (lectureId) filter.lectureId = lectureId;

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    AttendanceSession.find(filter)
      .sort({ opensAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AttendanceSession.countDocuments(filter),
  ]);

  const lectureIds = [...new Set(rows.map((s) => String(s.lectureId)))];
  const sessionIds = rows.map((s) => s._id);

  const [lectures, counts] = await Promise.all([
    lectureIds.length ? Lecture.find({ _id: { $in: lectureIds } }).select("title").lean() : [],
    sessionIds.length
      ? AttendanceRecord.aggregate([
          { $match: { sessionId: { $in: sessionIds } } },
          { $group: { _id: "$sessionId", count: { $sum: 1 } } },
        ])
      : [],
  ]);

  const titleByLecture = new Map(lectures.map((l) => [String(l._id), l.title]));
  const countBySession = new Map(counts.map((c) => [String(c._id), c.count]));

  // Never include `code` in list responses (API_CONTRACT.md §5).
  const items = rows.map((s) =>
    toAdminSessionDto(s, {
      code: null,
      lectureTitle: titleByLecture.get(String(s.lectureId)) ?? null,
      recordCount: countBySession.get(String(s._id)) ?? 0,
    }),
  );

  return paginated(items, total, { page, limit });
}

export async function getAttendanceSession(ctx, sessionId, { page = 1, limit = 20 } = {}) {
  assertConfigReady("attendance");
  await connectDb();

  const sess = await AttendanceSession.findById(sessionId).select("+codeEnc").lean();
  if (!sess) throw new AppError("NOT_FOUND");

  const skip = (page - 1) * limit;
  const [lecture, recordRows, totalRecords] = await Promise.all([
    Lecture.findById(sess.lectureId).select("title").lean(),
    AttendanceRecord.find({ sessionId: sess._id })
      .sort({ submittedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", select: "name" })
      .lean(),
    AttendanceRecord.countDocuments({ sessionId: sess._id }),
  ]);

  // Admin gets decrypted code ONLY while closedAt is null (T4, A1).
  let code = null;
  if (sess.closedAt === null && sess.codeEnc) {
    code = decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, String(sess._id), sess.codeEnc);
  }

  return {
    session: toAdminSessionDto(sess, {
      code,
      lectureTitle: lecture?.title ?? null,
      recordCount: totalRecords,
    }),
    records: paginated(
      recordRows.map((r) => ({
        userId: String(r.userId?._id ?? r.userId),
        name: r.userId?.name ?? "Student",
        submittedAt: new Date(r.submittedAt).toISOString(),
      })),
      totalRecords,
      { page, limit },
    ),
  };
}

export async function getAttendanceSummary(userId) {
  await connectDb();
  const attended = await AttendanceRecord.countDocuments({ userId });
  return { attended, percentage: null };
}

export async function getMyAttendance(ctx, { page = 1, limit = 20 } = {}) {
  assertConfigReady("attendance");
  await connectDb();

  const skip = (page - 1) * limit;
  const [summary, rows, total] = await Promise.all([
    getAttendanceSummary(ctx.actor.id),
    AttendanceRecord.find({ userId: ctx.actor.id })
      .sort({ submittedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "lectureId", select: "title" })
      .lean(),
    AttendanceRecord.countDocuments({ userId: ctx.actor.id }),
  ]);

  return {
    summary,
    history: paginated(
      rows.map((r) => ({
        lectureId: String(r.lectureId?._id ?? r.lectureId),
        title: r.lectureId?.title ?? "Lecture",
        submittedAt: new Date(r.submittedAt).toISOString(),
      })),
      total,
      { page, limit },
    ),
  };
}
