import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { NOTIFICATION_TYPES, notify } from "@/lib/db/notifications.js";
import { runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { Announcement } from "@/models/Announcement.js";
import { User } from "@/models/User.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toAnnouncementDto(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    type: doc.type,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
  };
}

export function toAdminAnnouncementDto(doc) {
  const creator = doc.createdBy && typeof doc.createdBy === "object" && doc.createdBy.name
    ? doc.createdBy.name
    : String(doc.createdBy ?? "");
  return {
    ...toAnnouncementDto(doc),
    status: doc.status,
    createdBy: creator,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export async function listAnnouncements(ctx, { page = 1, limit = 20, type, q } = {}) {
  await connectDb();
  const filter = { status: "published", deletedAt: null };
  if (type) filter.type = type;
  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [{ title: rx }, { body: rx }];
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Announcement.find(filter).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Announcement.countDocuments(filter),
  ]);
  return paginated(rows.map(toAnnouncementDto), total, { page, limit });
}

export async function getAnnouncement(ctx, id) {
  await connectDb();
  const doc = await Announcement.findOne({ _id: id, status: "published", deletedAt: null }).lean();
  if (!doc) throw new AppError("NOT_FOUND");
  return toAnnouncementDto(doc);
}

export async function listAdminAnnouncements(ctx, { page = 1, limit = 20 } = {}) {
  await connectDb();
  const filter = { deletedAt: null };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "createdBy", select: "name" })
      .lean(),
    Announcement.countDocuments(filter),
  ]);
  return paginated(rows.map(toAdminAnnouncementDto), total, { page, limit });
}

export async function getAdminAnnouncement(ctx, id) {
  await connectDb();
  const doc = await Announcement.findOne({ _id: id, deletedAt: null })
    .populate({ path: "createdBy", select: "name" })
    .lean();
  if (!doc) throw new AppError("NOT_FOUND");
  return toAdminAnnouncementDto(doc);
}

export async function createAnnouncement(ctx, { title, body, type }) {
  return runInTransaction(async (dbSession) => {
    const [created] = await Announcement.create(
      [
        {
          title: String(title).trim(),
          body: String(body).trim(),
          type,
          status: "draft",
          publishedAt: null,
          createdBy: ctx.actor.id,
          deletedAt: null,
        },
      ],
      { session: dbSession },
    );
    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.ANNOUNCEMENT_CREATE,
      entityType: "Announcement",
      entityId: created._id,
      summary: `Created announcement ${created.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });
    const populated = await Announcement.findById(created._id)
      .populate({ path: "createdBy", select: "name" })
      .session(dbSession)
      .lean();
    return toAdminAnnouncementDto(populated);
  });
}

export async function updateAnnouncement(ctx, id, patch) {
  return runInTransaction(async (dbSession) => {
    const doc = await Announcement.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    if (patch.title !== undefined) doc.title = String(patch.title).trim();
    if (patch.body !== undefined) doc.body = String(patch.body).trim();
    if (patch.type !== undefined) doc.type = patch.type;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.ANNOUNCEMENT_UPDATE,
      entityType: "Announcement",
      entityId: doc._id,
      summary: `Updated announcement ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    const populated = await Announcement.findById(doc._id)
      .populate({ path: "createdBy", select: "name" })
      .session(dbSession)
      .lean();
    return toAdminAnnouncementDto(populated);
  });
}

export async function publishAnnouncement(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Announcement.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    if (doc.status === "published") {
      throw new AppError("INVALID_STATE", {
        message: "Announcement is already published.",
      });
    }

    doc.status = "published";
    doc.publishedAt = ctx.now;
    await doc.save({ session: dbSession });

    const activeStudents = await User.find({ role: "student", status: "active" })
      .select("_id")
      .session(dbSession)
      .lean();
    await notify({
      userIds: activeStudents.map((s) => s._id),
      type: NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
      title: "Announcement published",
      body: doc.title,
      href: `/announcements/${doc._id}`,
      session: dbSession,
    });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.ANNOUNCEMENT_PUBLISH,
      entityType: "Announcement",
      entityId: doc._id,
      summary: `Published announcement ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    const populated = await Announcement.findById(doc._id)
      .populate({ path: "createdBy", select: "name" })
      .session(dbSession)
      .lean();
    return toAdminAnnouncementDto(populated);
  });
}

export async function deleteAnnouncement(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Announcement.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    doc.deletedAt = ctx.now;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.ANNOUNCEMENT_DELETE,
      entityType: "Announcement",
      entityId: doc._id,
      summary: `Deleted announcement ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return { id: String(doc._id) };
  });
}
