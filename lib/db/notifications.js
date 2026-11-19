import { Notification } from "@/models/Notification.js";
import { connectDb } from "./connect.js";

export const NOTIFICATION_TYPES = Object.freeze({
  ANNOUNCEMENT_PUBLISHED: "announcement_published",
  CONTEST_PUBLISHED: "contest_published",
  ATTENDANCE_RECORDED: "attendance_recorded",
});

/**
 * Inserts in-app notifications for one or more recipients (B15 triggers only).
 */
export async function notify({ userIds, type, title, body, href = null, session = null }) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  await connectDb();
  const uniqueIds = [...new Set(userIds.map((id) => String(id)))];
  const docs = uniqueIds.map((userId) => ({
    userId,
    type,
    title,
    body,
    href: href ?? null,
    readAt: null,
  }));
  if (session) {
    return Notification.insertMany(docs, { session });
  }
  return Notification.insertMany(docs);
}
