import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { revokeUserSessions } from "@/lib/auth/session.js";
import { User } from "@/models/User.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toAdminUserDto(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    rating: user.ratingCurrent ?? null,
    restrictedAt: user.restrictedAt ? new Date(user.restrictedAt).toISOString() : null,
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

export function toAdminUserDetailDto(user) {
  return {
    ...toAdminUserDto(user),
    handles: {
      codeforces: user.handles?.codeforces ?? null,
      leetcode: user.handles?.leetcode ?? null,
    },
    restrictedReason: user.restrictedReason ?? null,
    twoFactorEnabled: Boolean(user.twoFactor?.enabled),
  };
}

export async function listUsers(ctx, { page = 1, limit = 20, q, role, status } = {}) {
  await connectDb();
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }, { "handles.codeforces": rx }];
  }

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return paginated(rows.map(toAdminUserDetailDto), total, { page, limit });
}

export async function getUser(ctx, id) {
  await connectDb();
  const user = await User.findById(id).lean();
  if (!user) throw new AppError("NOT_FOUND");
  return toAdminUserDetailDto(user);
}

export async function restrictUser(ctx, id, { reason = null } = {}) {
  return runInTransaction(async (dbSession) => {
    const user = await User.findById(id).session(dbSession);
    if (!user) throw new AppError("NOT_FOUND");
    if (String(user._id) === String(ctx.actor.id)) {
      throw new AppError("INVALID_STATE", {
        message: "You cannot restrict your own account.",
      });
    }
    if (user.status === "restricted") {
      throw new AppError("INVALID_STATE", {
        message: "This user is already restricted.",
      });
    }

    user.status = "restricted";
    user.restrictedAt = ctx.now;
    user.restrictedReason = reason ? String(reason).trim() : null;
    await user.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.USER_RESTRICT,
      entityType: "User",
      entityId: user._id,
      summary: `Restricted account ${user.name}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toAdminUserDetailDto(user.toObject());
  });
}

export async function reopenUser(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const user = await User.findById(id).session(dbSession);
    if (!user) throw new AppError("NOT_FOUND");
    if (user.status !== "restricted") {
      throw new AppError("INVALID_STATE", {
        message: "User account is not restricted.",
      });
    }

    user.status = "active";
    user.restrictedAt = null;
    user.restrictedReason = null;
    await user.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.USER_REOPEN,
      entityType: "User",
      entityId: user._id,
      summary: `Reopened account ${user.name}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toAdminUserDetailDto(user.toObject());
  });
}

export async function setUserRole(ctx, id, role) {
  return runInTransaction(async (dbSession) => {
    const user = await User.findById(id).session(dbSession);
    if (!user) throw new AppError("NOT_FOUND");
    user.role = role;
    await user.save({ session: dbSession });
    await revokeUserSessions(user._id, { now: ctx.now, dbSession });
    await audit({
      actorId: ctx.actor?.id ?? null,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
      entityType: "User",
      entityId: user._id,
      summary: `Changed role of ${user.name} to ${role}`,
      correlationId: ctx.correlationId ?? "script",
      session: dbSession,
    });
    return toAdminUserDetailDto(user.toObject());
  });
}
