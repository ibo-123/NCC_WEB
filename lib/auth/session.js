import crypto from "node:crypto";
import { assertConfigReady, isProduction } from "@/lib/config/env.js";
import { connectDb } from "@/lib/db/connect.js";
import { AppError } from "@/lib/http/errors.js";
import { Session } from "@/models/Session.js";
import { User } from "@/models/User.js";
import { can } from "./permissions.js";

export const SESSION_COOKIE_NAME = "ncc_session";
export const STUDENT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const REAUTH_WINDOW_MS = 10 * 60 * 1000;
const LAST_USED_THROTTLE_MS = 60 * 1000;

export function sessionTtlMsForRole(role) {
  return role === "admin" ? ADMIN_SESSION_TTL_MS : STUDENT_SESSION_TTL_MS;
}

export function hashSessionToken(rawToken) {
  const { sessionSecret } = assertConfigReady("core");
  return crypto
    .createHmac("sha256", sessionSecret)
    .update(`session:${String(rawToken)}`)
    .digest("hex");
}

export function extractCookieToken(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function sanitizeUserAgent(ua) {
  if (!ua || typeof ua !== "string") return null;
  return ua.trim().slice(0, 200) || null;
}

export async function createSession({
  userId,
  role,
  twoFactorVerified,
  userAgent = null,
  reauthAt = null,
  now = new Date(),
  dbSession = null,
}) {
  if (typeof twoFactorVerified !== "boolean") {
    throw new TypeError("createSession requires explicit boolean twoFactorVerified");
  }
  await connectDb();
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(now.getTime() + sessionTtlMsForRole(role));
  const doc = {
    userId,
    tokenHash,
    expiresAt,
    lastUsedAt: now,
    revokedAt: null,
    userAgent: sanitizeUserAgent(userAgent),
    twoFactorVerified,
    reauthAt,
  };
  let session;
  if (dbSession) {
    [session] = await Session.create([doc], { session: dbSession });
  } else {
    session = await Session.create(doc);
  }
  return { rawToken, session, expiresAt };
}

export async function revokeSession(sessionId, { now = new Date(), dbSession = null } = {}) {
  await connectDb();
  await Session.updateOne(
    { _id: sessionId, revokedAt: null },
    { $set: { revokedAt: now } },
    dbSession ? { session: dbSession } : {},
  );
}

export async function revokeUserSessions(userId, { now = new Date(), dbSession = null } = {}) {
  await connectDb();
  await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: now } },
    dbSession ? { session: dbSession } : {},
  );
}

export function serializeSessionCookie(rawToken, expiresAt, now = new Date()) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000));
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isProduction()) parts.push("Secure");
  return parts.join("; ");
}

export function serializeClearSessionCookie() {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProduction()) parts.push("Secure");
  return parts.join("; ");
}

/**
 * Resolves the caller's session and user from MongoDB on every protected API request.
 * Enforces pending-2FA allow-list, restricted-user allow-list, and RBAC permission map.
 */
export async function resolveAccess(request, declaration, { now = new Date() } = {}) {
  const rawToken = extractCookieToken(request);
  if (!rawToken) {
    throw new AppError("UNAUTHENTICATED");
  }

  await connectDb();
  const tokenHash = hashSessionToken(rawToken);
  const session = await Session.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: now },
  }).lean();

  if (!session) {
    throw new AppError("UNAUTHENTICATED");
  }

  const user = await User.findById(session.userId).lean();
  if (!user) {
    throw new AppError("UNAUTHENTICATED");
  }

  // Throttle lastUsedAt write to once per 60s.
  if (!session.lastUsedAt || now.getTime() - new Date(session.lastUsedAt).getTime() >= LAST_USED_THROTTLE_MS) {
    await Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: now } }).catch(() => {});
  }

  const permission = declaration.permission;

  // State 1: Awaiting 2FA — only auth.2fa.verify and auth.logout allowed.
  if (session.twoFactorVerified === false) {
    if (permission === "auth.2fa.verify" || permission === "auth.logout") {
      if (!can(user.role, permission)) {
        throw new AppError("FORBIDDEN");
      }
      if (permission === "auth.2fa.verify") {
        const twofa = assertConfigReady("admin2fa");
        if (!twofa.enabled) {
          throw new AppError("DEPENDENCY_UNAVAILABLE", {
            message: "Two-factor authentication is disabled by platform configuration.",
          });
        }
      }
      return { user, session };
    }
    throw new AppError("UNAUTHENTICATED");
  }

  // State-gate auth.2fa.verify: already verified sessions cannot re-verify.
  if (permission === "auth.2fa.verify") {
    throw new AppError("FORBIDDEN", { message: "Session has already completed two-factor verification." });
  }

  if (permission === "twofa.enroll") {
    const twofa = assertConfigReady("admin2fa");
    if (!twofa.enabled) {
      throw new AppError("DEPENDENCY_UNAVAILABLE", {
        message: "Two-factor authentication is disabled by platform configuration.",
      });
    }
  }

  // State 2: Restricted account — only auth.me and auth.logout allowed.
  if (user.status === "restricted") {
    if (permission === "auth.me" || permission === "auth.logout") {
      return { user, session };
    }
    throw new AppError("ACCOUNT_RESTRICTED");
  }

  // State 3: Active session — verify role permission.
  if (!can(user.role, permission)) {
    throw new AppError("FORBIDDEN");
  }

  return { user, session };
}
