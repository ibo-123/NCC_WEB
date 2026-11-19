import crypto from "node:crypto";
import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { isDuplicateKeyError, runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { Team } from "@/models/Team.js";
import { TeamMembership } from "@/models/TeamMembership.js";
import { User } from "@/models/User.js";

export const TEAM_MAX_MEMBERS = 5;
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "team"
  );
}

function generateInviteCode(len = 8) {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += INVITE_ALPHABET[crypto.randomInt(0, INVITE_ALPHABET.length)];
  }
  return out;
}

export async function buildTeamDto(team, dbSession = null) {
  const query = TeamMembership.find({ teamId: team._id, status: "active" }).sort({ joinedAt: 1 });
  if (dbSession) query.session(dbSession);
  const memberships = await query.lean();

  const userIds = memberships.map((m) => m.userId);
  let users = [];
  if (userIds.length > 0) {
    const uQuery = User.find({ _id: { $in: userIds } }).select("name handles");
    if (dbSession) uQuery.session(dbSession);
    users = await uQuery.lean();
  }
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const hasStreak = team.streakCurrent !== null || team.streakLongest !== null;
  return {
    id: String(team._id),
    name: team.name,
    slug: team.slug,
    inviteCode: team.inviteCode,
    captainId: String(team.captainId),
    status: team.status,
    maxMembers: TEAM_MAX_MEMBERS,
    memberCount: memberships.length,
    members: memberships.map((m) => {
      const u = userById.get(String(m.userId));
      return {
        userId: String(m.userId),
        name: u?.name ?? "Student",
        role: m.role,
        handles: {
          codeforces: u?.handles?.codeforces ?? null,
        },
        joinedAt: new Date(m.joinedAt).toISOString(),
      };
    }),
    streak: hasStreak
      ? { current: team.streakCurrent ?? 0, longest: team.streakLongest ?? 0 }
      : null,
  };
}

export async function getMyTeam(ctx) {
  await connectDb();
  const membership = await TeamMembership.findOne({
    userId: ctx.actor.id,
    status: "active",
  }).lean();
  if (!membership) return null;

  const team = await Team.findOne({
    _id: membership.teamId,
    status: "active",
    deletedAt: null,
  }).lean();
  if (!team) return null;

  return buildTeamDto(team);
}

export async function createTeam(ctx, { name }) {
  const trimmed = String(name ?? "").trim();
  const slug = slugify(trimmed);

  return runInTransaction(async (dbSession) => {
    const existingMembership = await TeamMembership.exists({
      userId: ctx.actor.id,
      status: "active",
    }).session(dbSession);
    if (existingMembership) {
      throw new AppError("INVALID_STATE", {
        message: "Leave your current team before creating a new one.",
      });
    }

    const existingSlug = await Team.exists({ slug, deletedAt: null }).session(dbSession);
    if (existingSlug) {
      throw new AppError("CONFLICT", {
        message: "An active team with a similar name already exists.",
        fields: { name: "An active team with this name already exists." },
      });
    }

    try {
      const [team] = await Team.create(
        [
          {
            name: trimmed,
            slug,
            inviteCode: generateInviteCode(8),
            captainId: ctx.actor.id,
            status: "active",
            memberCount: 1,
            streakCurrent: null,
            streakLongest: null,
            deletedAt: null,
          },
        ],
        { session: dbSession },
      );

      await TeamMembership.create(
        [
          {
            teamId: team._id,
            userId: ctx.actor.id,
            role: "captain",
            status: "active",
            joinedAt: ctx.now,
            leftAt: null,
          },
        ],
        { session: dbSession },
      );

      return buildTeamDto(team.toObject(), dbSession);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new AppError("CONFLICT", {
          message: "Unable to create team due to conflicting team name or active membership.",
        });
      }
      throw err;
    }
  });
}

export async function joinTeam(ctx, { inviteCode }) {
  const normalizedCode = String(inviteCode ?? "").trim().toUpperCase();

  return runInTransaction(async (dbSession) => {
    const existingMembership = await TeamMembership.exists({
      userId: ctx.actor.id,
      status: "active",
    }).session(dbSession);
    if (existingMembership) {
      throw new AppError("INVALID_STATE", {
        message: "You are already on an active team.",
      });
    }

    const team = await Team.findOne({
      inviteCode: normalizedCode,
      deletedAt: null,
    }).session(dbSession);
    if (!team) {
      throw new AppError("NOT_FOUND", {
        message: "No active team found for that invite code.",
      });
    }
    if (team.status !== "active") {
      throw new AppError("INVALID_STATE", {
        message: "This team has been disbanded.",
      });
    }

    const updatedTeam = await Team.findOneAndUpdate(
      {
        _id: team._id,
        status: "active",
        deletedAt: null,
        memberCount: { $lt: TEAM_MAX_MEMBERS },
      },
      { $inc: { memberCount: 1 } },
      { session: dbSession, new: true },
    );

    if (!updatedTeam) {
      throw new AppError("INVALID_STATE", {
        message: "This team has reached the maximum member limit.",
      });
    }

    await TeamMembership.findOneAndUpdate(
      { teamId: team._id, userId: ctx.actor.id },
      {
        $set: {
          role: "member",
          status: "active",
          joinedAt: ctx.now,
          leftAt: null,
        },
      },
      { upsert: true, session: dbSession, new: true },
    );

    return buildTeamDto(updatedTeam.toObject(), dbSession);
  });
}

export async function leaveTeam(ctx) {
  return runInTransaction(async (dbSession) => {
    const membership = await TeamMembership.findOne({
      userId: ctx.actor.id,
      status: "active",
    }).session(dbSession);
    if (!membership) {
      throw new AppError("INVALID_STATE", { message: "You are not on an active team." });
    }

    const team = await Team.findOne({
      _id: membership.teamId,
      status: "active",
      deletedAt: null,
    }).session(dbSession);
    if (!team) throw new AppError("NOT_FOUND");

    if (membership.role === "captain" && team.memberCount > 1) {
      throw new AppError("INVALID_STATE", {
        message: "Transfer captaincy or disband the team before leaving.",
      });
    }

    membership.status = "left";
    membership.leftAt = ctx.now;
    await membership.save({ session: dbSession });

    if (team.memberCount <= 1) {
      team.status = "disbanded";
      team.memberCount = 0;
      team.deletedAt = ctx.now;
    } else {
      team.memberCount -= 1;
    }
    await team.save({ session: dbSession });

    return { ok: true };
  });
}

export async function removeMember(ctx, targetUserId) {
  return runInTransaction(async (dbSession) => {
    const captainMembership = await TeamMembership.findOne({
      userId: ctx.actor.id,
      status: "active",
    }).session(dbSession);
    if (!captainMembership) {
      throw new AppError("NOT_FOUND", { message: "Active team not found." });
    }

    const team = await Team.findOne({
      _id: captainMembership.teamId,
      status: "active",
      deletedAt: null,
    }).session(dbSession);
    if (!team) throw new AppError("NOT_FOUND");

    if (String(team.captainId) !== String(ctx.actor.id)) {
      throw new AppError("FORBIDDEN", {
        message: "Only the team captain can remove members.",
      });
    }
    if (String(targetUserId) === String(ctx.actor.id)) {
      throw new AppError("INVALID_STATE", {
        message: "Captain cannot remove themselves. Use transfer or disband.",
      });
    }

    const targetMembership = await TeamMembership.findOne({
      teamId: team._id,
      userId: targetUserId,
      status: "active",
    }).session(dbSession);
    if (!targetMembership) {
      throw new AppError("NOT_FOUND", { message: "Target member not found on this team." });
    }

    targetMembership.status = "left";
    targetMembership.leftAt = ctx.now;
    await targetMembership.save({ session: dbSession });

    team.memberCount = Math.max(0, team.memberCount - 1);
    await team.save({ session: dbSession });

    return buildTeamDto(team.toObject(), dbSession);
  });
}

export async function transferCaptain(ctx, targetUserId) {
  return runInTransaction(async (dbSession) => {
    const captainMembership = await TeamMembership.findOne({
      userId: ctx.actor.id,
      status: "active",
    }).session(dbSession);
    if (!captainMembership) {
      throw new AppError("NOT_FOUND", { message: "Active team not found." });
    }

    const team = await Team.findOne({
      _id: captainMembership.teamId,
      status: "active",
      deletedAt: null,
    }).session(dbSession);
    if (!team) throw new AppError("NOT_FOUND");

    if (String(team.captainId) !== String(ctx.actor.id)) {
      throw new AppError("FORBIDDEN", {
        message: "Only the team captain can transfer captaincy.",
      });
    }

    const targetMembership = await TeamMembership.findOne({
      teamId: team._id,
      userId: targetUserId,
      status: "active",
    }).session(dbSession);
    if (!targetMembership) {
      throw new AppError("INVALID_STATE", {
        message: "Selected user is not an active team member.",
      });
    }

    captainMembership.role = "member";
    targetMembership.role = "captain";
    team.captainId = targetUserId;

    await Promise.all([
      captainMembership.save({ session: dbSession }),
      targetMembership.save({ session: dbSession }),
      team.save({ session: dbSession }),
    ]);

    return buildTeamDto(team.toObject(), dbSession);
  });
}

export async function disbandTeam(ctx) {
  return runInTransaction(async (dbSession) => {
    const membership = await TeamMembership.findOne({
      userId: ctx.actor.id,
      status: "active",
    }).session(dbSession);
    if (!membership) {
      throw new AppError("NOT_FOUND", { message: "Active team not found." });
    }

    const team = await Team.findOne({
      _id: membership.teamId,
      status: "active",
      deletedAt: null,
    }).session(dbSession);
    if (!team) throw new AppError("NOT_FOUND");

    if (String(team.captainId) !== String(ctx.actor.id)) {
      throw new AppError("FORBIDDEN", {
        message: "Only the team captain can disband this team.",
      });
    }

    team.status = "disbanded";
    team.memberCount = 0;
    team.deletedAt = ctx.now;
    await team.save({ session: dbSession });

    await TeamMembership.updateMany(
      { teamId: team._id, status: "active" },
      { $set: { status: "left", leftAt: ctx.now } },
      { session: dbSession },
    );

    return { id: String(team._id) };
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAdminTeams(ctx, { page = 1, limit = 20, q, status } = {}) {
  await connectDb();
  const filter = {};
  if (status) filter.status = status;
  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [{ name: rx }, { inviteCode: rx }];
  }

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Team.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Team.countDocuments(filter),
  ]);

  const items = await Promise.all(rows.map((t) => buildTeamDto(t)));
  return paginated(items, total, { page, limit });
}

export async function getAdminTeam(ctx, id) {
  await connectDb();
  const team = await Team.findById(id).lean();
  if (!team) throw new AppError("NOT_FOUND");
  return buildTeamDto(team);
}

export async function adminDisbandTeam(ctx, id, { reason = null } = {}) {
  return runInTransaction(async (dbSession) => {
    const team = await Team.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!team) throw new AppError("NOT_FOUND");
    if (team.status === "disbanded") {
      throw new AppError("INVALID_STATE", { message: "Team is already disbanded." });
    }

    team.status = "disbanded";
    team.memberCount = 0;
    team.deletedAt = ctx.now;
    await team.save({ session: dbSession });

    await TeamMembership.updateMany(
      { teamId: team._id, status: "active" },
      { $set: { status: "left", leftAt: ctx.now } },
      { session: dbSession },
    );

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.TEAM_DISBAND,
      entityType: "Team",
      entityId: team._id,
      summary: `Disbanded team ${team.name}${reason ? ` (${String(reason).trim()})` : ""}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return { id: String(team._id) };
  });
}
