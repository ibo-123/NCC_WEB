import crypto from "node:crypto";
import { assertConfigReady } from "@/lib/config/env.js";
import { connectDb } from "@/lib/db/connect.js";
import { RateLimit } from "@/models/RateLimit.js";

export const RATE_LIMIT_SCOPES = Object.freeze({
  LOGIN: "LOGIN",
  LOGIN_IP: "LOGIN_IP",
  REGISTER: "REGISTER",
  ATTENDANCE: "ATTENDANCE",
  ATTENDANCE_SESSION: "ATTENDANCE_SESSION",
  ATTENDANCE_IP: "ATTENDANCE_IP",
  TWOFA_VERIFY: "TWOFA_VERIFY",
  SOLVE_CHECK: "SOLVE_CHECK",
});

function policyFor(scope) {
  switch (scope) {
    case RATE_LIMIT_SCOPES.LOGIN:
      return { max: 5, windowSeconds: 900, lockoutSeconds: 900 };
    case RATE_LIMIT_SCOPES.LOGIN_IP:
      return { max: 30, windowSeconds: 900, lockoutSeconds: 0 };
    case RATE_LIMIT_SCOPES.REGISTER:
      return { max: 5, windowSeconds: 3600, lockoutSeconds: 0 };
    case RATE_LIMIT_SCOPES.ATTENDANCE: {
      const att = assertConfigReady("attendance");
      return {
        max: att.maxAttempts,
        windowSeconds: att.lockoutSeconds,
        lockoutSeconds: att.lockoutSeconds,
      };
    }
    case RATE_LIMIT_SCOPES.ATTENDANCE_SESSION:
      return { max: 300, windowSeconds: 3600, lockoutSeconds: 0 };
    case RATE_LIMIT_SCOPES.ATTENDANCE_IP:
      return { max: 300, windowSeconds: 900, lockoutSeconds: 0 };
    case RATE_LIMIT_SCOPES.TWOFA_VERIFY:
      return { max: 5, windowSeconds: 900, lockoutSeconds: 900 };
    case RATE_LIMIT_SCOPES.SOLVE_CHECK:
      return { max: 10, windowSeconds: 3600, lockoutSeconds: 0 };
    default:
      throw new TypeError(`Unknown rate limit scope "${String(scope)}"`);
  }
}

export function rateLimitKey(scope, subject) {
  const { sessionSecret } = assertConfigReady("core");
  const digest = crypto
    .createHmac("sha256", sessionSecret)
    .update(`rate-limit:${scope}:${String(subject)}`)
    .digest("hex");
  return `${scope}:${digest}`;
}

export function clientIpFromRequest(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "127.0.0.1";
}

function secondsRemaining(until, now) {
  if (!until) return 1;
  return Math.max(1, Math.ceil((new Date(until).getTime() - now.getTime()) / 1000));
}

/**
 * Checks if a key is currently blocked without incrementing its counter.
 */
export async function checkRateLimit(scope, subject, { now = new Date() } = {}) {
  await connectDb();
  const { max, windowSeconds } = policyFor(scope);
  const key = rateLimitKey(scope, subject);
  const doc = await RateLimit.findOne({ key }).lean();
  if (!doc) {
    return { allowed: true, count: 0, remaining: max, retryAfterSeconds: 0 };
  }
  if (doc.lockedUntil && new Date(doc.lockedUntil) > now) {
    return {
      allowed: false,
      count: doc.count,
      remaining: 0,
      retryAfterSeconds: secondsRemaining(doc.lockedUntil, now),
    };
  }
  const windowEnd = new Date(new Date(doc.windowStartsAt).getTime() + windowSeconds * 1000);
  if (windowEnd > now && doc.count >= max) {
    return {
      allowed: false,
      count: doc.count,
      remaining: 0,
      retryAfterSeconds: secondsRemaining(windowEnd, now),
    };
  }
  return {
    allowed: true,
    count: windowEnd > now ? doc.count : 0,
    remaining: Math.max(0, max - (windowEnd > now ? doc.count : 0)),
    retryAfterSeconds: 0,
  };
}

/**
 * Atomically checks and increments a Mongo-backed rate limit counter.
 * When `count` reaches `max` and `lockoutSeconds > 0`, sets `lockedUntil`.
 */
export async function consumeRateLimit(scope, subject, { now = new Date() } = {}) {
  await connectDb();
  const { max, windowSeconds, lockoutSeconds } = policyFor(scope);
  const key = rateLimitKey(scope, subject);
  const windowCutoff = new Date(now.getTime() - windowSeconds * 1000);
  const ttlSeconds = Math.max(windowSeconds, lockoutSeconds || 0) + 60;
  const nextExpiry = new Date(now.getTime() + ttlSeconds * 1000);
  const lockDurationMs = lockoutSeconds * 1000;

  const isLockedOrWindowExpired = {
    $and: [
      { $lte: [{ $ifNull: ["$lockedUntil", new Date(0)] }, now] },
      { $lt: [{ $ifNull: ["$windowStartsAt", new Date(0)] }, windowCutoff] },
    ],
  };

  const doc = await RateLimit.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          key,
          _currentlyLocked: { $gt: [{ $ifNull: ["$lockedUntil", new Date(0)] }, now] },
          _resetWindow: {
            $cond: [
              { $gt: [{ $ifNull: ["$lockedUntil", new Date(0)] }, now] },
              false,
              {
                $or: [
                  { $eq: [{ $type: "$windowStartsAt" }, "missing"] },
                  { $lt: ["$windowStartsAt", windowCutoff] },
                ],
              },
            ],
          },
        },
      },
      {
        $set: {
          windowStartsAt: {
            $cond: ["$_resetWindow", now, "$windowStartsAt"],
          },
          count: {
            $cond: [
              "$_currentlyLocked",
              "$count",
              { $cond: ["$_resetWindow", 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }] },
            ],
          },
        },
      },
      {
        $set: {
          lockedUntil: {
            $cond: [
              "$_currentlyLocked",
              "$lockedUntil",
              {
                $cond: [
                  { $and: [{ $gt: [lockDurationMs, 0] }, { $gte: ["$count", max] }] },
                  new Date(now.getTime() + lockDurationMs),
                  null,
                ],
              },
            ],
          },
          expiresAt: {
            $cond: [
              isLockedOrWindowExpired,
              nextExpiry,
              { $max: [{ $ifNull: ["$expiresAt", nextExpiry] }, nextExpiry] },
            ],
          },
        },
      },
      { $unset: ["_currentlyLocked", "_resetWindow"] },
    ],
    { upsert: true, returnDocument: "after", updatePipeline: true },
  ).lean();

  if (doc.lockedUntil && new Date(doc.lockedUntil) > now) {
    // Allow request that just triggered lockout vs refuse after max?
    // When count > max, definitely blocked. When count >= max and lockedUntil is set on failure:
    // Callers call consumeRateLimit BEFORE or AFTER failure:
    // - For REGISTER / SOLVE_CHECK (call before action): allow up to `max` (count <= max), block when count > max!
    // - For LOGIN / ATTENDANCE / TWOFA_VERIFY failures: increment on each failure; on count >= max, user is locked out for subsequent attempts (or immediately).
    return {
      allowed: doc.count <= max && lockoutSeconds === 0,
      lockedOutNow: true,
      count: doc.count,
      remaining: 0,
      retryAfterSeconds: secondsRemaining(doc.lockedUntil, now),
    };
  }

  const windowEnd = new Date(new Date(doc.windowStartsAt).getTime() + windowSeconds * 1000);
  const allowed = doc.count <= max;
  return {
    allowed,
    lockedOutNow: false,
    count: doc.count,
    remaining: Math.max(0, max - doc.count),
    retryAfterSeconds: allowed ? 0 : secondsRemaining(windowEnd, now),
  };
}

export async function resetRateLimit(scope, subject) {
  await connectDb();
  const key = rateLimitKey(scope, subject);
  await RateLimit.deleteOne({ key });
}
