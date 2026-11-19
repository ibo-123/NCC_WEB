import { connectDb } from "@/lib/db/connect.js";
import { paginated } from "@/lib/http/pagination.js";
import { Notification } from "@/models/Notification.js";

export function toNotificationDto(doc) {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    href: doc.href ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export async function listNotifications(ctx, { page = 1, limit = 20 } = {}) {
  await connectDb();
  const filter = { userId: ctx.actor.id };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);
  return paginated(rows.map(toNotificationDto), total, { page, limit });
}
