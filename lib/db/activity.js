import { ActivityEvent } from "@/models/ActivityEvent.js";
import { campusDay } from "@/lib/config/time.js";
import { connectDb } from "./connect.js";
import { isDuplicateKeyError } from "./transactions.js";

export const ACTIVITY_TYPES = Object.freeze({
  PROBLEM_SOLVED: "problem_solved",
  ATTENDANCE: "attendance",
  CONTEST_RESULT: "contest_result",
  RATING_CHANGE: "rating_change",
  TEAM_CONTEST_RESULT: "team_contest_result",
});

/**
 * Idempotently records a student or team activity event keyed by (userId, type, refId).
 */
export async function recordActivity({
  userId,
  type,
  refId,
  teamId = null,
  occurredAt = new Date(),
  session = null,
}) {
  await connectDb();
  const instant = occurredAt instanceof Date ? occurredAt : new Date(occurredAt);
  const day = campusDay(instant);
  const payload = {
    userId,
    type,
    refId,
    teamId: teamId || null,
    occurredAt: instant,
    day,
  };
  try {
    if (session) {
      const [doc] = await ActivityEvent.create([payload], { session });
      return doc;
    }
    return await ActivityEvent.create(payload);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return null;
    }
    throw err;
  }
}
