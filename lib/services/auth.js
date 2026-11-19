import { assertConfigReady, getEnv } from "@/lib/config/env.js";
import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { isDuplicateKeyError, runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { AEAD_PURPOSES, decrypt, encrypt } from "@/lib/security/aead.js";
import {
  RATE_LIMIT_SCOPES,
  checkRateLimit,
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/security/rateLimit.js";
import { hashPassword, validatePasswordBytes, verifyPassword } from "@/lib/auth/password.js";
import {
  REAUTH_WINDOW_MS,
  createSession,
  revokeSession,
} from "@/lib/auth/session.js";
import { generateTotpSecret, verifyTotpCode } from "@/lib/auth/totp.js";
import { Session } from "@/models/Session.js";
import { User } from "@/models/User.js";

export function toUserSelfDto(user) {
  const dto = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    rating: user.ratingCurrent ?? null,
    handles: {
      codeforces: user.handles?.codeforces ?? null,
      leetcode: user.handles?.leetcode ?? null,
    },
  };
  if (user.role === "admin") {
    dto.twoFactorEnabled = Boolean(user.twoFactor?.enabled);
  }
  return dto;
}

export async function registerUser(ctx, { name, email, password, confirmPassword, clientIp }) {
  const registration = assertConfigReady("registration");
  if (registration.mode !== "open") {
    throw new AppError("FORBIDDEN", {
      message: "Registration is currently closed by platform policy.",
    });
  }

  const rl = await consumeRateLimit(RATE_LIMIT_SCOPES.REGISTER, clientIp || "127.0.0.1", {
    now: ctx.now,
  });
  if (!rl.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: rl.retryAfterSeconds });
  }

  const byteError = validatePasswordBytes(password);
  if (byteError) {
    throw new AppError("VALIDATION_ERROR", { fields: { password: byteError } });
  }
  if (password !== confirmPassword) {
    throw new AppError("VALIDATION_ERROR", {
      fields: { confirmPassword: "Passwords do not match." },
    });
  }

  await connectDb();
  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  try {
    const created = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "student",
      status: "active",
    });
    return { user: toUserSelfDto(created) };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError("CONFLICT", {
        message: "An account with this email already exists.",
        fields: { email: "An account with this email already exists." },
      });
    }
    throw err;
  }
}

export async function loginUser(ctx, { email, password, clientIp = "127.0.0.1", userAgent = null }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const ipSubject = clientIp || "127.0.0.1";
  const emailIpSubject = `${normalizedEmail}:${ipSubject}`;

  const [ipCheck, accountCheck] = await Promise.all([
    checkRateLimit(RATE_LIMIT_SCOPES.LOGIN_IP, ipSubject, { now: ctx.now }),
    checkRateLimit(RATE_LIMIT_SCOPES.LOGIN, emailIpSubject, { now: ctx.now }),
  ]);
  if (!ipCheck.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: ipCheck.retryAfterSeconds });
  }
  if (!accountCheck.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: accountCheck.retryAfterSeconds });
  }

  await connectDb();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash").lean();
  const valid = await verifyPassword(password, user?.passwordHash);

  if (!user || !valid) {
    const [accConsumed, ipConsumed] = await Promise.all([
      consumeRateLimit(RATE_LIMIT_SCOPES.LOGIN, emailIpSubject, { now: ctx.now }),
      consumeRateLimit(RATE_LIMIT_SCOPES.LOGIN_IP, ipSubject, { now: ctx.now }),
    ]);
    if (!ipConsumed.allowed) {
      throw new AppError("RATE_LIMITED", { retryAfterSeconds: ipConsumed.retryAfterSeconds });
    }
    if (!accConsumed.allowed || accConsumed.lockedOutNow) {
      throw new AppError("RATE_LIMITED", { retryAfterSeconds: accConsumed.retryAfterSeconds });
    }
    throw new AppError("UNAUTHENTICATED", { message: "Invalid email or password." });
  }

  await resetRateLimit(RATE_LIMIT_SCOPES.LOGIN, emailIpSubject);

  const admin2fa = assertConfigReady("admin2fa");
  const requiresTwoFactor = Boolean(
    admin2fa.enabled && user.role === "admin" && user.twoFactor?.enabled,
  );

  const { rawToken, expiresAt } = await createSession({
    userId: user._id,
    role: user.role,
    twoFactorVerified: !requiresTwoFactor,
    userAgent,
    now: ctx.now,
  });

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: ctx.now } });

  return {
    user: toUserSelfDto(user),
    requiresTwoFactor,
    rawToken,
    expiresAt,
  };
}

export async function logoutSession(ctx) {
  if (ctx.session?._id) {
    await revokeSession(ctx.session._id, { now: ctx.now });
  }
  return {};
}

export async function getCurrentUser(ctx) {
  await connectDb();
  const user = await User.findById(ctx.actor.id).lean();
  if (!user) throw new AppError("UNAUTHENTICATED");
  const env = getEnv();
  return {
    user: {
      ...toUserSelfDto(user),
      restrictedAt: user.restrictedAt ? new Date(user.restrictedAt).toISOString() : null,
      restrictedReason: user.restrictedReason ?? null,
    },
    admin2faEnabled: Boolean(env.admin2fa?.enabled),
    registrationOpen: env.registration?.mode === "open",
    restrictedContactEmail: env.restrictedContact?.email ?? null,
  };
}

export async function updateHandles(ctx, { codeforces, leetcode }) {
  await connectDb();
  const setFields = {};
  const unsetFields = {};

  if (codeforces !== undefined) {
    const cf = String(codeforces ?? "").trim();
    if (cf) setFields["handles.codeforces"] = cf;
    else unsetFields["handles.codeforces"] = "";
  }
  if (leetcode !== undefined) {
    const lc = String(leetcode ?? "").trim();
    if (lc) setFields["handles.leetcode"] = lc;
    else unsetFields["handles.leetcode"] = "";
  }

  const update = {};
  if (Object.keys(setFields).length) update.$set = setFields;
  if (Object.keys(unsetFields).length) update.$unset = unsetFields;

  if (!Object.keys(update).length) {
    const existing = await User.findById(ctx.actor.id).lean();
    return {
      handles: {
        codeforces: existing?.handles?.codeforces ?? null,
        leetcode: existing?.handles?.leetcode ?? null,
      },
    };
  }

  try {
    const updated = await User.findByIdAndUpdate(ctx.actor.id, update, {
      new: true,
      runValidators: true,
    }).lean();
    return {
      handles: {
        codeforces: updated?.handles?.codeforces ?? null,
        leetcode: updated?.handles?.leetcode ?? null,
      },
    };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const keyPattern = err?.keyPattern ?? err?.cause?.keyPattern ?? {};
      const fields = {};
      if ("handles.codeforces" in keyPattern || String(err.message).includes("codeforces")) {
        fields.codeforces = "This Codeforces handle is already linked to another account.";
      } else if ("handles.leetcode" in keyPattern || String(err.message).includes("leetcode")) {
        fields.leetcode = "This LeetCode handle is already linked to another account.";
      } else {
        fields.codeforces = "This handle is already linked to another account.";
      }
      throw new AppError("CONFLICT", {
        message: "Handle already linked to another account.",
        fields,
      });
    }
    throw err;
  }
}

export async function startTwoFactorEnrollment(ctx, { password }) {
  const twofa = assertConfigReady("admin2fa");
  if (!twofa.enabled) {
    throw new AppError("DEPENDENCY_UNAVAILABLE", {
      message: "Two-factor authentication is disabled.",
    });
  }

  await connectDb();
  const user = await User.findById(ctx.actor.id).select("+passwordHash").lean();
  if (!user) throw new AppError("UNAUTHENTICATED");

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError("UNAUTHENTICATED", { message: "Current password is incorrect." });
  }

  if (user.twoFactor?.enabled) {
    throw new AppError("INVALID_STATE", {
      message: "Two-factor authentication is already enabled on this account.",
    });
  }

  const { secretBase32, otpauthUri } = generateTotpSecret({ email: user.email });
  const secretEnc = encrypt(AEAD_PURPOSES.ADMIN_2FA_SECRET, String(user._id), secretBase32);

  await runInTransaction(async (dbSession) => {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          "twoFactor.enabled": false,
          "twoFactor.secretEnc": secretEnc,
          "twoFactor.enabledAt": null,
          "twoFactor.lastUsedStep": null,
        },
      },
      { session: dbSession },
    );
    await Session.updateOne(
      { _id: ctx.session._id },
      { $set: { reauthAt: ctx.now } },
      { session: dbSession },
    );
  });

  return { otpauthUri, secret: secretBase32 };
}

export async function confirmTwoFactorEnrollment(ctx, { code }) {
  const twofa = assertConfigReady("admin2fa");
  if (!twofa.enabled) {
    throw new AppError("DEPENDENCY_UNAVAILABLE", {
      message: "Two-factor authentication is disabled.",
    });
  }

  const reauthAt = ctx.session?.reauthAt ? new Date(ctx.session.reauthAt) : null;
  if (!reauthAt || ctx.now.getTime() - reauthAt.getTime() > REAUTH_WINDOW_MS) {
    throw new AppError("UNAUTHENTICATED", {
      message: "Recent password verification expired. Restart 2FA setup.",
    });
  }

  await connectDb();
  const user = await User.findById(ctx.actor.id).select("+twoFactor.secretEnc").lean();
  if (!user || !user.twoFactor?.secretEnc) {
    throw new AppError("INVALID_STATE", {
      message: "Start two-factor setup before confirming a verification code.",
    });
  }
  if (user.twoFactor.enabled) {
    throw new AppError("INVALID_STATE", {
      message: "Two-factor authentication is already enabled.",
    });
  }

  const secretBase32 = decrypt(
    AEAD_PURPOSES.ADMIN_2FA_SECRET,
    String(user._id),
    user.twoFactor.secretEnc,
  );
  const check = verifyTotpCode({
    secretBase32,
    code,
    now: ctx.now,
    lastUsedStep: user.twoFactor.lastUsedStep ?? null,
  });

  if (!check.valid) {
    throw new AppError("UNAUTHENTICATED", {
      message: "Invalid verification code. Enter the 6 digits from your authenticator.",
    });
  }

  await runInTransaction(async (dbSession) => {
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [
          { "twoFactor.lastUsedStep": null },
          { "twoFactor.lastUsedStep": { $lt: check.matchedStep } },
        ],
      },
      {
        $set: {
          "twoFactor.enabled": true,
          "twoFactor.enabledAt": ctx.now,
          "twoFactor.lastUsedStep": check.matchedStep,
        },
      },
      { session: dbSession, new: true },
    );

    if (!updated) {
      throw new AppError("UNAUTHENTICATED", {
        message: "Verification code already used. Wait for the next code.",
      });
    }

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.TWOFA_ENROLL,
      entityType: "User",
      entityId: user._id,
      summary: "Enrolled admin two-factor authentication",
      correlationId: ctx.correlationId,
      session: dbSession,
    });
  });

  return { enabled: true };
}

export async function verifyTwoFactor(ctx, { code }) {
  const twofa = assertConfigReady("admin2fa");
  if (!twofa.enabled) {
    throw new AppError("DEPENDENCY_UNAVAILABLE", {
      message: "Two-factor authentication is disabled.",
    });
  }

  const sessionKey = String(ctx.session._id);
  const preCheck = await checkRateLimit(RATE_LIMIT_SCOPES.TWOFA_VERIFY, sessionKey, {
    now: ctx.now,
  });
  if (!preCheck.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: preCheck.retryAfterSeconds });
  }

  await connectDb();
  const user = await User.findById(ctx.actor.id).select("+twoFactor.secretEnc").lean();
  if (!user || !user.twoFactor?.enabled || !user.twoFactor?.secretEnc) {
    throw new AppError("INVALID_STATE", {
      message: "Two-factor authentication is not enrolled on this account.",
    });
  }

  const secretBase32 = decrypt(
    AEAD_PURPOSES.ADMIN_2FA_SECRET,
    String(user._id),
    user.twoFactor.secretEnc,
  );
  const check = verifyTotpCode({
    secretBase32,
    code,
    now: ctx.now,
    lastUsedStep: user.twoFactor.lastUsedStep ?? null,
  });

  if (!check.valid) {
    const consumed = await consumeRateLimit(RATE_LIMIT_SCOPES.TWOFA_VERIFY, sessionKey, {
      now: ctx.now,
    });
    if (!consumed.allowed || consumed.lockedOutNow) {
      await revokeSession(ctx.session._id, { now: ctx.now });
      throw new AppError("RATE_LIMITED", { retryAfterSeconds: consumed.retryAfterSeconds });
    }
    throw new AppError("UNAUTHENTICATED", {
      message: "Invalid or expired verification code.",
    });
  }

  await resetRateLimit(RATE_LIMIT_SCOPES.TWOFA_VERIFY, sessionKey);

  const sessionResult = await runInTransaction(async (dbSession) => {
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [
          { "twoFactor.lastUsedStep": null },
          { "twoFactor.lastUsedStep": { $lt: check.matchedStep } },
        ],
      },
      { $set: { "twoFactor.lastUsedStep": check.matchedStep } },
      { session: dbSession, new: true },
    );

    if (!updated) {
      throw new AppError("UNAUTHENTICATED", {
        message: "Verification code already used. Wait for the next code.",
      });
    }

    await revokeSession(ctx.session._id, { now: ctx.now, dbSession });
    return createSession({
      userId: user._id,
      role: user.role,
      twoFactorVerified: true,
      userAgent: ctx.session.userAgent ?? null,
      reauthAt: ctx.now,
      now: ctx.now,
      dbSession,
    });
  });

  return {
    user: toUserSelfDto(user),
    rawToken: sessionResult.rawToken,
    expiresAt: sessionResult.expiresAt,
  };
}
