import { ACTIVITY_TYPES, recordActivity } from "@/lib/db/activity.js";
import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { NOTIFICATION_TYPES, notify } from "@/lib/db/notifications.js";
import { runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { fetchContestStandings } from "@/lib/integrations/codeforces.js";
import { Contest } from "@/models/Contest.js";
import { ContestResult } from "@/models/ContestResult.js";
import { Team } from "@/models/Team.js";
import { TeamContestResult } from "@/models/TeamContestResult.js";
import { TeamMembership } from "@/models/TeamMembership.js";
import { User } from "@/models/User.js";

export const TEAM_WEEKLY_CONTEST_MINUTES = 10080;

export function deriveContestStatus(contest, now = new Date()) {
  const start = new Date(contest.startsAt).getTime();
  const end = start + Number(contest.durationMinutes) * 60 * 1000;
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t >= end) return "completed";
  return "active";
}

export function toContestDto(
  contest,
  { now = new Date(), myResult = null, myTeamResult = null, includeAdmin = false } = {},
) {
  const dto = {
    id: String(contest._id),
    title: contest.title,
    description: contest.description ?? "",
    mode: contest.mode,
    platform: contest.platform,
    url: contest.url,
    invitationUrl: contest.invitationUrl ?? null,
    startsAt: new Date(contest.startsAt).toISOString(),
    durationMinutes: contest.durationMinutes,
    status: deriveContestStatus(contest, now),
    resultsPublished: contest.resultsState === "published",
    myResult,
    myTeamResult,
  };
  if (includeAdmin) {
    dto.platformContestId = contest.platformContestId;
    dto.publication = contest.publication;
    dto.resultsState = contest.resultsState;
    dto.lastFetchedAt = contest.lastFetchedAt
      ? new Date(contest.lastFetchedAt).toISOString()
      : null;
    dto.fetchSummary = contest.fetchSummary
      ? {
          processed: contest.fetchSummary.processed ?? 0,
          matched: contest.fetchSummary.matched ?? 0,
          unmatchedHandles: contest.fetchSummary.unmatchedHandles ?? [],
          ...(contest.fetchSummary.teamsMatched !== undefined
            ? { teamsMatched: contest.fetchSummary.teamsMatched }
            : {}),
        }
      : null;
  }
  return dto;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---- Student Reads ----
export async function listContests(ctx, { page = 1, limit = 20, mode } = {}) {
  await connectDb();
  const filter = { publication: "published", deletedAt: null };
  if (mode) filter.mode = mode;

  const skip = (page - 1) * limit;
  const [contests, total] = await Promise.all([
    Contest.find(filter).sort({ startsAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Contest.countDocuments(filter),
  ]);

  const publishedResultContests = contests.filter((c) => c.resultsState === "published").map((c) => c._id);
  let myResultByContest = new Map();
  let myTeamResultByContest = new Map();

  if (publishedResultContests.length && ctx.actor?.id) {
    const [myRows, userDoc, activeMembership] = await Promise.all([
      ContestResult.find({
        contestId: { $in: publishedResultContests },
        userId: ctx.actor.id,
      }).lean(),
      User.findById(ctx.actor.id).select("name").lean(),
      TeamMembership.findOne({ userId: ctx.actor.id, status: "active" }).lean(),
    ]);
    myResultByContest = new Map(
      myRows.map((r) => [
        String(r.contestId),
        {
          rank: r.rank,
          points: r.points,
          penalty: r.penalty,
          handle: r.handle,
          name: userDoc?.name ?? "",
          isMe: true,
        },
      ]),
    );

    if (activeMembership) {
      const [teamDoc, teamRows] = await Promise.all([
        Team.findById(activeMembership.teamId).select("name").lean(),
        TeamContestResult.find({
          contestId: { $in: publishedResultContests },
          teamId: activeMembership.teamId,
        }).lean(),
      ]);
      myTeamResultByContest = new Map(
        teamRows.map((tr) => [
          String(tr.contestId),
          {
            teamId: String(tr.teamId),
            teamName: teamDoc?.name ?? "My Team",
            rank: tr.rank,
            points: tr.points,
            penalty: tr.penalty,
            memberCount: tr.memberCount,
            matchedMembers: tr.matchedMembers,
            isMine: true,
          },
        ]),
      );
    }
  }

  return paginated(
    contests.map((c) =>
      toContestDto(c, {
        now: ctx.now,
        myResult: myResultByContest.get(String(c._id)) ?? null,
        myTeamResult:
          c.mode === "team" ? myTeamResultByContest.get(String(c._id)) ?? null : null,
      }),
    ),
    total,
    { page, limit },
  );
}

export async function getContest(ctx, id) {
  await connectDb();
  const contest = await Contest.findOne({
    _id: id,
    publication: "published",
    deletedAt: null,
  }).lean();
  if (!contest) throw new AppError("NOT_FOUND");

  let myResult = null;
  let myTeamResult = null;
  if (contest.resultsState === "published" && ctx.actor?.id) {
    const [row, userDoc, activeMembership] = await Promise.all([
      ContestResult.findOne({ contestId: contest._id, userId: ctx.actor.id }).lean(),
      User.findById(ctx.actor.id).select("name").lean(),
      TeamMembership.findOne({ userId: ctx.actor.id, status: "active" }).lean(),
    ]);
    if (row) {
      myResult = {
        rank: row.rank,
        points: row.points,
        penalty: row.penalty,
        handle: row.handle,
        name: userDoc?.name ?? "",
        isMe: true,
      };
    }
    if (contest.mode === "team" && activeMembership) {
      const [teamDoc, tr] = await Promise.all([
        Team.findById(activeMembership.teamId).select("name").lean(),
        TeamContestResult.findOne({
          contestId: contest._id,
          teamId: activeMembership.teamId,
        }).lean(),
      ]);
      if (tr) {
        myTeamResult = {
          teamId: String(tr.teamId),
          teamName: teamDoc?.name ?? "My Team",
          rank: tr.rank,
          points: tr.points,
          penalty: tr.penalty,
          memberCount: tr.memberCount,
          matchedMembers: tr.matchedMembers,
          isMine: true,
        };
      }
    }
  }

  return toContestDto(contest, { now: ctx.now, myResult, myTeamResult });
}

export async function listResults(ctx, contestId, { page = 1, limit = 50, q } = {}) {
  await connectDb();
  const contest = await Contest.findOne({
    _id: contestId,
    publication: "published",
    deletedAt: null,
  }).lean();
  if (!contest || contest.resultsState !== "published") {
    throw new AppError("NOT_FOUND");
  }

  const allMemberRows = await ContestResult.find({ contestId: contest._id })
    .sort({ rank: 1, _id: 1 })
    .lean();
  const userIds = allMemberRows.map((r) => r.userId);
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select("name").lean()
    : [];
  const nameByUser = new Map(users.map((u) => [String(u._id), u.name]));

  const qLower = q ? String(q).trim().toLowerCase() : "";
  const formattedMembers = allMemberRows
    .map((r) => ({
      userId: String(r.userId),
      rank: r.rank,
      points: r.points,
      penalty: r.penalty,
      handle: r.handle,
      name: nameByUser.get(String(r.userId)) ?? r.handle,
      isMe: String(r.userId) === String(ctx.actor?.id),
    }))
    .filter((row) =>
      !qLower ||
      row.name.toLowerCase().includes(qLower) ||
      row.handle.toLowerCase().includes(qLower),
    );

  if (contest.mode === "individual") {
    const skip = (page - 1) * limit;
    const paged = formattedMembers.slice(skip, skip + limit);
    return paginated(paged, formattedMembers.length, { page, limit });
  }

  // mode === "team"
  const [teamRows, myMembership] = await Promise.all([
    TeamContestResult.find({ contestId: contest._id }).sort({ rank: 1, _id: 1 }).lean(),
    ctx.actor?.id
      ? TeamMembership.findOne({ userId: ctx.actor.id, status: "active" }).lean()
      : null,
  ]);
  const teamIds = teamRows.map((t) => t.teamId);
  const teams = teamIds.length
    ? await Team.find({ _id: { $in: teamIds }, deletedAt: null }).select("name").lean()
    : [];
  const teamNameById = new Map(teams.map((t) => [String(t._id), t.name]));

  const formattedTeams = teamRows
    .filter((t) => teamNameById.has(String(t.teamId)))
    .map((t) => ({
      teamId: String(t.teamId),
      teamName: teamNameById.get(String(t.teamId)),
      rank: t.rank,
      points: t.points,
      penalty: t.penalty,
      memberCount: t.memberCount,
      matchedMembers: t.matchedMembers,
      isMine: myMembership ? String(t.teamId) === String(myMembership.teamId) : false,
    }))
    .filter((t) => !qLower || t.teamName.toLowerCase().includes(qLower));

  return {
    teams: formattedTeams,
    members: formattedMembers,
  };
}

// ---- Admin Contests ----
export async function listAdminContests(ctx, { page = 1, limit = 20, mode } = {}) {
  await connectDb();
  const filter = { deletedAt: null };
  if (mode) filter.mode = mode;

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Contest.find(filter).sort({ startsAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Contest.countDocuments(filter),
  ]);

  return paginated(
    rows.map((c) => toContestDto(c, { now: ctx.now, includeAdmin: true })),
    total,
    { page, limit },
  );
}

export async function getAdminContest(ctx, id) {
  await connectDb();
  const doc = await Contest.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) throw new AppError("NOT_FOUND");
  return toContestDto(doc, { now: ctx.now, includeAdmin: true });
}

export async function createContest(ctx, input) {
  const mode = input.mode === "team" ? "team" : "individual";
  const durationMinutes =
    input.durationMinutes ?? (mode === "team" ? TEAM_WEEKLY_CONTEST_MINUTES : 120);

  return runInTransaction(async (dbSession) => {
    const [created] = await Contest.create(
      [
        {
          title: String(input.title).trim(),
          description: String(input.description ?? "").trim(),
          mode,
          platform: "codeforces",
          platformContestId: String(input.platformContestId).trim(),
          url: String(input.url).trim(),
          invitationUrl: input.invitationUrl ? String(input.invitationUrl).trim() : null,
          startsAt: new Date(input.startsAt),
          durationMinutes: Number(durationMinutes),
          publication: "draft",
          resultsState: "not_fetched",
          lastFetchedAt: null,
          fetchSummary: null,
          deletedAt: null,
        },
      ],
      { session: dbSession },
    );

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.CONTEST_CREATE,
      entityType: "Contest",
      entityId: created._id,
      summary: `Created contest ${created.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toContestDto(created.toObject(), { now: ctx.now, includeAdmin: true });
  });
}

export async function updateContest(ctx, id, patch) {
  return runInTransaction(async (dbSession) => {
    const doc = await Contest.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    if (patch.title !== undefined) doc.title = String(patch.title).trim();
    if (patch.description !== undefined) doc.description = String(patch.description ?? "").trim();
    if (patch.mode !== undefined) doc.mode = patch.mode;
    if (patch.platformContestId !== undefined) {
      doc.platformContestId = String(patch.platformContestId).trim();
    }
    if (patch.url !== undefined) doc.url = String(patch.url).trim();
    if (patch.invitationUrl !== undefined) {
      doc.invitationUrl = patch.invitationUrl ? String(patch.invitationUrl).trim() : null;
    }
    if (patch.startsAt !== undefined) doc.startsAt = new Date(patch.startsAt);
    if (patch.durationMinutes !== undefined) doc.durationMinutes = Number(patch.durationMinutes);

    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.CONTEST_UPDATE,
      entityType: "Contest",
      entityId: doc._id,
      summary: `Updated contest ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toContestDto(doc.toObject(), { now: ctx.now, includeAdmin: true });
  });
}

export async function publishContest(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Contest.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    if (doc.publication === "published") {
      throw new AppError("INVALID_STATE", { message: "Contest is already published." });
    }

    doc.publication = "published";
    await doc.save({ session: dbSession });

    const activeStudents = await User.find({ role: "student", status: "active" })
      .select("_id")
      .session(dbSession)
      .lean();
    await notify({
      userIds: activeStudents.map((s) => s._id),
      type: NOTIFICATION_TYPES.CONTEST_PUBLISHED,
      title: "Contest published",
      body: `${doc.title} is scheduled on Codeforces.`,
      href: `/contests/${doc._id}`,
      session: dbSession,
    });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.CONTEST_PUBLISH,
      entityType: "Contest",
      entityId: doc._id,
      summary: `Published contest ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toContestDto(doc.toObject(), { now: ctx.now, includeAdmin: true });
  });
}

export async function deleteContest(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Contest.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    doc.deletedAt = ctx.now;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.CONTEST_DELETE,
      entityType: "Contest",
      entityId: doc._id,
      summary: `Deleted contest ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return { id: String(doc._id) };
  });
}

export async function listFetchedResults(ctx, contestId, { page = 1, limit = 50 } = {}) {
  await connectDb();
  const contest = await Contest.findOne({ _id: contestId, deletedAt: null }).lean();
  if (!contest) throw new AppError("NOT_FOUND");

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    ContestResult.find({ contestId: contest._id })
      .sort({ rank: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContestResult.countDocuments({ contestId: contest._id }),
  ]);

  const userIds = rows.map((r) => r.userId);
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select("name").lean()
    : [];
  const nameByUser = new Map(users.map((u) => [String(u._id), u.name]));

  const items = rows.map((r) => ({
    userId: String(r.userId),
    handle: r.handle,
    name: nameByUser.get(String(r.userId)) ?? r.handle,
    rank: r.rank,
    points: r.points,
    penalty: r.penalty,
    fetchedAt: new Date(r.fetchedAt).toISOString(),
  }));

  let teams = [];
  if (contest.mode === "team") {
    const teamRows = await TeamContestResult.find({ contestId: contest._id })
      .sort({ rank: 1, _id: 1 })
      .lean();
    const teamIds = teamRows.map((t) => t.teamId);
    const teamDocs = teamIds.length
      ? await Team.find({ _id: { $in: teamIds }, deletedAt: null }).select("name").lean()
      : [];
    const teamNameById = new Map(teamDocs.map((t) => [String(t._id), t.name]));
    teams = teamRows
      .filter((t) => teamNameById.has(String(t.teamId)))
      .map((t) => ({
        teamId: String(t.teamId),
        teamName: teamNameById.get(String(t.teamId)),
        rank: t.rank,
        points: t.points,
        penalty: t.penalty,
        memberCount: t.memberCount,
        matchedMembers: t.matchedMembers,
      }));
  }

  return {
    ...paginated(items, total, { page, limit }),
    teams,
    fetchSummary: contest.fetchSummary ?? null,
    resultsState: contest.resultsState,
  };
}

export async function fetchResults(
  ctx,
  contestId,
  { fetchContestStandingsImpl = fetchContestStandings } = {},
) {
  await connectDb();
  const contest = await Contest.findOne({ _id: contestId, deletedAt: null }).lean();
  if (!contest) throw new AppError("NOT_FOUND");
  if (contest.resultsState === "published") {
    throw new AppError("INVALID_STATE", {
      message: "Published results cannot be overwritten.",
    });
  }

  const standings = await fetchContestStandingsImpl(contest.platformContestId);

  const usersWithCf = await User.find({
    "handles.codeforces": { $type: "string" },
  })
    .select("_id name handles.codeforces")
    .lean();
  const userByHandleLower = new Map(
    usersWithCf.map((u) => [u.handles.codeforces.trim().toLowerCase(), u]),
  );

  const matchedRows = [];
  const unmatchedHandles = [];
  const seenUsers = new Set();

  for (const row of standings) {
    const key = row.handle.trim().toLowerCase();
    const matchedUser = userByHandleLower.get(key);
    if (!matchedUser) {
      unmatchedHandles.push(row.handle);
      continue;
    }
    const uid = String(matchedUser._id);
    if (seenUsers.has(uid)) continue;
    seenUsers.add(uid);
    matchedRows.push({
      userId: matchedUser._id,
      handle: matchedUser.handles.codeforces,
      rank: row.rank,
      points: row.points,
      penalty: row.penalty,
    });
  }

  return runInTransaction(async (dbSession) => {
    const lockedContest = await Contest.findOne({ _id: contestId, deletedAt: null }).session(
      dbSession,
    );
    if (!lockedContest) throw new AppError("NOT_FOUND");
    if (lockedContest.resultsState === "published") {
      throw new AppError("INVALID_STATE", {
        message: "Published results cannot be overwritten.",
      });
    }

    for (const r of matchedRows) {
      await ContestResult.findOneAndUpdate(
        { contestId: lockedContest._id, userId: r.userId },
        {
          $set: {
            handle: r.handle,
            rank: r.rank,
            points: r.points,
            penalty: r.penalty,
            fetchedAt: ctx.now,
          },
        },
        { upsert: true, session: dbSession },
      );
    }

    let teamsMatched;
    if (lockedContest.mode === "team" && matchedRows.length > 0) {
      const matchedIds = matchedRows.map((r) => r.userId);
      const memberships = await TeamMembership.find({
        userId: { $in: matchedIds },
        status: "active",
      })
        .session(dbSession)
        .lean();

      const teamIds = [...new Set(memberships.map((m) => String(m.teamId)))];
      const activeTeams = teamIds.length
        ? await Team.find({ _id: { $in: teamIds }, status: "active", deletedAt: null })
            .session(dbSession)
            .lean()
        : [];
      const activeTeamMap = new Map(activeTeams.map((t) => [String(t._id), t]));
      const rowByUser = new Map(matchedRows.map((r) => [String(r.userId), r]));

      const teamAgg = new Map();
      for (const m of memberships) {
        const tId = String(m.teamId);
        const teamDoc = activeTeamMap.get(tId);
        if (!teamDoc) continue;
        const memberRow = rowByUser.get(String(m.userId));
        if (!memberRow) continue;
        if (!teamAgg.has(tId)) {
          teamAgg.set(tId, {
            teamId: teamDoc._id,
            points: 0,
            penalty: 0,
            matchedMembers: 0,
            memberCount: teamDoc.memberCount,
          });
        }
        const entry = teamAgg.get(tId);
        entry.points += Number(memberRow.points || 0);
        entry.penalty += Number(memberRow.penalty || 0);
        entry.matchedMembers += 1;
      }

      const sortedTeams = [...teamAgg.values()].sort(
        (a, b) => b.points - a.points || a.penalty - b.penalty,
      );
      for (let idx = 0; idx < sortedTeams.length; idx += 1) {
        const item = sortedTeams[idx];
        await TeamContestResult.findOneAndUpdate(
          { contestId: lockedContest._id, teamId: item.teamId },
          {
            $set: {
              points: item.points,
              penalty: item.penalty,
              rank: idx + 1,
              memberCount: item.memberCount,
              matchedMembers: item.matchedMembers,
              fetchedAt: ctx.now,
            },
          },
          { upsert: true, session: dbSession },
        );
      }
      teamsMatched = sortedTeams.length;
    } else if (lockedContest.mode === "team") {
      teamsMatched = 0;
    }

    const fetchSummary = {
      processed: standings.length,
      matched: matchedRows.length,
      unmatchedHandles: unmatchedHandles.slice(0, 50),
      ...(teamsMatched !== undefined ? { teamsMatched } : {}),
    };

    lockedContest.resultsState = "fetched";
    lockedContest.lastFetchedAt = ctx.now;
    lockedContest.fetchSummary = fetchSummary;
    await lockedContest.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.RESULTS_FETCH,
      entityType: "Contest",
      entityId: lockedContest._id,
      summary: `Fetched Codeforces standings for ${lockedContest.title} · ${matchedRows.length} matched`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return {
      processed: fetchSummary.processed,
      matched: fetchSummary.matched,
      unmatchedHandles: fetchSummary.unmatchedHandles,
      ...(teamsMatched !== undefined ? { teamsMatched } : {}),
      resultsState: lockedContest.resultsState,
    };
  });
}

export async function publishResults(ctx, contestId) {
  return runInTransaction(async (dbSession) => {
    const contest = await Contest.findOne({ _id: contestId, deletedAt: null }).session(dbSession);
    if (!contest) throw new AppError("NOT_FOUND");
    if (contest.resultsState !== "fetched") {
      throw new AppError("INVALID_STATE", {
        message: "Fetch contest results before publishing.",
      });
    }

    contest.resultsState = "published";
    await contest.save({ session: dbSession });

    const memberRows = await ContestResult.find({ contestId: contest._id })
      .session(dbSession)
      .lean();
    for (const r of memberRows) {
      await recordActivity({
        userId: r.userId,
        type: ACTIVITY_TYPES.CONTEST_RESULT,
        refId: contest._id,
        occurredAt: ctx.now,
        session: dbSession,
      });
    }

    if (contest.mode === "team") {
      const teamRows = await TeamContestResult.find({ contestId: contest._id })
        .session(dbSession)
        .lean();
      for (const tr of teamRows) {
        const memberships = await TeamMembership.find({
          teamId: tr.teamId,
          status: "active",
        })
          .session(dbSession)
          .lean();
        for (const m of memberships) {
          await recordActivity({
            userId: m.userId,
            type: ACTIVITY_TYPES.TEAM_CONTEST_RESULT,
            refId: contest._id,
            teamId: tr.teamId,
            occurredAt: ctx.now,
            session: dbSession,
          });
        }
      }
    }

    // B15: publishing results creates NO student notification rows.
    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.RESULTS_PUBLISH,
      entityType: "Contest",
      entityId: contest._id,
      summary: `Published standings for ${contest.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toContestDto(contest.toObject(), { now: ctx.now, includeAdmin: true });
  });
}
