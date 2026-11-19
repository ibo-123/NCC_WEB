import { ACTIVITY_TYPES, recordActivity } from "@/lib/db/activity.js";
import { AUDIT_ACTIONS, audit } from "@/lib/db/audit.js";
import { connectDb } from "@/lib/db/connect.js";
import { isDuplicateKeyError, runInTransaction } from "@/lib/db/transactions.js";
import { AppError } from "@/lib/http/errors.js";
import { paginated } from "@/lib/http/pagination.js";
import { fetchUserSubmissions } from "@/lib/integrations/codeforces.js";
import { RATE_LIMIT_SCOPES, consumeRateLimit } from "@/lib/security/rateLimit.js";
import { Problem } from "@/models/Problem.js";
import { ProblemVerification } from "@/models/ProblemVerification.js";
import { Topic } from "@/models/Topic.js";
import { User } from "@/models/User.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(str) {
  return (
    String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "topic"
  );
}

export function toTopicDto(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    order: doc.order ?? 0,
  };
}

export function toProblemProgressDto(problem, verification = null, { includeAdmin = false } = {}) {
  const dto = {
    id: String(problem._id),
    title: problem.title,
    topicId: String(problem.topicId),
    platform: problem.platform,
    url: problem.url,
    value: problem.value ?? null,
    status: verification ? verification.status : "unsolved",
    solvedAt: verification?.solvedAt ? new Date(verification.solvedAt).toISOString() : null,
    lastCheckedAt: verification?.lastCheckedAt
      ? new Date(verification.lastCheckedAt).toISOString()
      : null,
  };
  if (includeAdmin) {
    dto.status = problem.status;
    dto.externalRef = problem.externalRef ?? {};
  }
  return dto;
}

/**
 * Eligibility check for provisional solve verification (SERVICES.md §5, B8).
 */
export function isSolveEligible({ problem, submission }) {
  if (!problem || !submission) return false;
  if (submission.verdict !== "OK") return false;
  if (problem.platform !== "codeforces") return false;
  const targetContestId = Number(problem.externalRef?.contestId);
  const targetIndex = String(problem.externalRef?.index ?? "").trim().toUpperCase();
  if (!targetContestId || !targetIndex) return false;
  return (
    Number(submission.contestId) === targetContestId &&
    String(submission.index ?? "").trim().toUpperCase() === targetIndex
  );
}

// ---- Admin Topics ----
export async function listAdminTopics(ctx, { page = 1, limit = 50 } = {}) {
  await connectDb();
  const filter = { deletedAt: null };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Topic.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Topic.countDocuments(filter),
  ]);
  return paginated(rows.map(toTopicDto), total, { page, limit });
}

export async function getAdminTopic(ctx, id) {
  await connectDb();
  const doc = await Topic.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) throw new AppError("NOT_FOUND");
  return toTopicDto(doc);
}

export async function createTopic(ctx, { name, slug, order }) {
  const normalizedSlug = slugify(slug || name);
  return runInTransaction(async (dbSession) => {
    try {
      const [created] = await Topic.create(
        [
          {
            name: String(name).trim(),
            slug: normalizedSlug,
            order: Number.isFinite(Number(order)) ? Number(order) : 0,
            deletedAt: null,
          },
        ],
        { session: dbSession },
      );

      await audit({
        actorId: ctx.actor.id,
        action: AUDIT_ACTIONS.TOPIC_CREATE,
        entityType: "Topic",
        entityId: created._id,
        summary: `Created topic ${created.name}`,
        correlationId: ctx.correlationId,
        session: dbSession,
      });

      return toTopicDto(created.toObject());
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new AppError("CONFLICT", {
          message: "A topic with this slug already exists.",
          fields: { slug: "A topic with this slug already exists." },
        });
      }
      throw err;
    }
  });
}

export async function updateTopic(ctx, id, patch) {
  return runInTransaction(async (dbSession) => {
    const doc = await Topic.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    if (patch.name !== undefined) doc.name = String(patch.name).trim();
    if (patch.slug !== undefined) doc.slug = slugify(patch.slug);
    if (patch.order !== undefined) doc.order = Number(patch.order);

    try {
      await doc.save({ session: dbSession });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new AppError("CONFLICT", {
          message: "A topic with this slug already exists.",
          fields: { slug: "A topic with this slug already exists." },
        });
      }
      throw err;
    }

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.TOPIC_UPDATE,
      entityType: "Topic",
      entityId: doc._id,
      summary: `Updated topic ${doc.name}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toTopicDto(doc.toObject());
  });
}

export async function deleteTopic(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Topic.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    const hasProblems = await Problem.exists({ topicId: doc._id, deletedAt: null }).session(dbSession);
    if (hasProblems) {
      throw new AppError("INVALID_STATE", {
        message: "Remove or delete all problems in this topic before deleting it.",
      });
    }

    doc.deletedAt = ctx.now;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.TOPIC_DELETE,
      entityType: "Topic",
      entityId: doc._id,
      summary: `Deleted topic ${doc.name}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return { id: String(doc._id) };
  });
}

// ---- Admin Problems ----
export async function listAdminProblems(ctx, { page = 1, limit = 20, topicId, status } = {}) {
  await connectDb();
  const filter = { deletedAt: null };
  if (topicId) filter.topicId = topicId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Problem.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Problem.countDocuments(filter),
  ]);

  return paginated(
    rows.map((p) => toProblemProgressDto(p, null, { includeAdmin: true })),
    total,
    { page, limit },
  );
}

export async function getAdminProblem(ctx, id) {
  await connectDb();
  const doc = await Problem.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) throw new AppError("NOT_FOUND");
  return toProblemProgressDto(doc, null, { includeAdmin: true });
}

export async function createProblem(ctx, { title, topicId, platform, url, value, externalRef }) {
  return runInTransaction(async (dbSession) => {
    const topic = await Topic.findOne({ _id: topicId, deletedAt: null }).session(dbSession);
    if (!topic) {
      throw new AppError("NOT_FOUND", { message: "Selected topic was not found." });
    }

    const [created] = await Problem.create(
      [
        {
          title: String(title).trim(),
          topicId: topic._id,
          platform,
          url: String(url).trim(),
          value: value ?? null,
          externalRef: externalRef ?? {},
          status: "draft",
          deletedAt: null,
        },
      ],
      { session: dbSession },
    );

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.PROBLEM_CREATE,
      entityType: "Problem",
      entityId: created._id,
      summary: `Added problem ${created.title} · ${topic.name}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toProblemProgressDto(created.toObject(), null, { includeAdmin: true });
  });
}

export async function updateProblem(ctx, id, patch) {
  return runInTransaction(async (dbSession) => {
    const doc = await Problem.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");

    if (patch.topicId !== undefined) {
      const topic = await Topic.findOne({ _id: patch.topicId, deletedAt: null }).session(dbSession);
      if (!topic) throw new AppError("NOT_FOUND", { message: "Selected topic was not found." });
      doc.topicId = topic._id;
    }
    if (patch.title !== undefined) doc.title = String(patch.title).trim();
    if (patch.platform !== undefined) doc.platform = patch.platform;
    if (patch.url !== undefined) doc.url = String(patch.url).trim();
    if (patch.value !== undefined) doc.value = patch.value ?? null;
    if (patch.externalRef !== undefined) doc.externalRef = patch.externalRef;

    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.PROBLEM_UPDATE,
      entityType: "Problem",
      entityId: doc._id,
      summary: `Updated problem ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toProblemProgressDto(doc.toObject(), null, { includeAdmin: true });
  });
}

export async function publishProblem(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Problem.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    if (doc.status === "published") {
      throw new AppError("INVALID_STATE", { message: "Problem is already published." });
    }
    doc.status = "published";
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.PROBLEM_PUBLISH,
      entityType: "Problem",
      entityId: doc._id,
      summary: `Published problem ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return toProblemProgressDto(doc.toObject(), null, { includeAdmin: true });
  });
}

export async function deleteProblem(ctx, id) {
  return runInTransaction(async (dbSession) => {
    const doc = await Problem.findOne({ _id: id, deletedAt: null }).session(dbSession);
    if (!doc) throw new AppError("NOT_FOUND");
    doc.deletedAt = ctx.now;
    await doc.save({ session: dbSession });

    await audit({
      actorId: ctx.actor.id,
      action: AUDIT_ACTIONS.PROBLEM_DELETE,
      entityType: "Problem",
      entityId: doc._id,
      summary: `Deleted problem ${doc.title}`,
      correlationId: ctx.correlationId,
      session: dbSession,
    });

    return { id: String(doc._id) };
  });
}

// ---- Student Progress & Solve Check ----
export async function getMyProgress(ctx) {
  await connectDb();
  const [topics, problems, verifications] = await Promise.all([
    Topic.find({ deletedAt: null }).sort({ order: 1, name: 1 }).lean(),
    Problem.find({ status: "published", deletedAt: null }).lean(),
    ProblemVerification.find({ userId: ctx.actor.id, status: "solved" }).lean(),
  ]);

  const solvedProblemIds = new Set(verifications.map((v) => String(v.problemId)));
  const byTopic = new Map(topics.map((t) => [String(t._id), { total: 0, solved: 0 }]));

  let totalSolved = 0;
  let totalProblems = 0;

  for (const p of problems) {
    const bucket = byTopic.get(String(p.topicId));
    if (!bucket) continue;
    totalProblems += 1;
    bucket.total += 1;
    if (solvedProblemIds.has(String(p._id))) {
      totalSolved += 1;
      bucket.solved += 1;
    }
  }

  return {
    solved: totalSolved,
    total: totalProblems,
    topics: topics.map((t) => {
      const counts = byTopic.get(String(t._id)) ?? { solved: 0, total: 0 };
      return {
        id: String(t._id),
        name: t.name,
        slug: t.slug,
        order: t.order ?? 0,
        solved: counts.solved,
        total: counts.total,
      };
    }),
  };
}

export async function listTopicProblems(ctx, topicId, { page = 1, limit = 50 } = {}) {
  await connectDb();
  const topic = await Topic.findOne({ _id: topicId, deletedAt: null }).lean();
  if (!topic) throw new AppError("NOT_FOUND");

  const filter = { topicId: topic._id, status: "published", deletedAt: null };
  const skip = (page - 1) * limit;
  const [problems, total] = await Promise.all([
    Problem.find(filter).sort({ createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    Problem.countDocuments(filter),
  ]);

  const problemIds = problems.map((p) => p._id);
  const verifs = problemIds.length
    ? await ProblemVerification.find({ userId: ctx.actor.id, problemId: { $in: problemIds } }).lean()
    : [];
  const verifMap = new Map(verifs.map((v) => [String(v.problemId), v]));

  return paginated(
    problems.map((p) => toProblemProgressDto(p, verifMap.get(String(p._id)) ?? null)),
    total,
    { page, limit },
  );
}

export async function getProblemProgress(ctx, id) {
  await connectDb();
  const problem = await Problem.findOne({ _id: id, status: "published", deletedAt: null }).lean();
  if (!problem) throw new AppError("NOT_FOUND");
  const verif = await ProblemVerification.findOne({
    userId: ctx.actor.id,
    problemId: problem._id,
  }).lean();
  return toProblemProgressDto(problem, verif);
}

export async function checkSolve(ctx, problemId, { fetchUserSubmissionsImpl = fetchUserSubmissions } = {}) {
  await connectDb();
  const problem = await Problem.findOne({
    _id: problemId,
    status: "published",
    deletedAt: null,
  }).lean();
  if (!problem) throw new AppError("NOT_FOUND");

  const existingVerif = await ProblemVerification.findOne({
    userId: ctx.actor.id,
    problemId: problem._id,
  }).lean();

  // LeetCode checks are unavailable in v1 and award no progress (B7).
  if (problem.platform === "leetcode") {
    return {
      result: "unavailable",
      message: "LeetCode provisional solve checks are unavailable in v1; no progress awarded.",
      problem: toProblemProgressDto(problem, existingVerif),
    };
  }

  const user = await User.findById(ctx.actor.id).lean();
  const cfHandle = user?.handles?.codeforces?.trim();
  if (!cfHandle) {
    return {
      result: "unlinked",
      message: "Link your Codeforces handle on your profile before running a solve check.",
      problem: toProblemProgressDto(problem, existingVerif),
    };
  }

  const rl = await consumeRateLimit(RATE_LIMIT_SCOPES.SOLVE_CHECK, String(ctx.actor.id), {
    now: ctx.now,
  });
  if (!rl.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: rl.retryAfterSeconds });
  }

  const submissions = await fetchUserSubmissionsImpl(cfHandle);
  const matching = submissions
    .filter((sub) => isSolveEligible({ problem, submission: sub }))
    .sort((a, b) => (a.creationTimeSeconds ?? 0) - (b.creationTimeSeconds ?? 0))[0];

  if (matching) {
    const solvedAt = matching.creationTimeSeconds
      ? new Date(matching.creationTimeSeconds * 1000)
      : ctx.now;

    const updated = await runInTransaction(async (dbSession) => {
      const doc = await ProblemVerification.findOneAndUpdate(
        { userId: ctx.actor.id, problemId: problem._id },
        {
          $set: {
            status: "solved",
            platform: problem.platform,
            solvedAt,
            verifiedAt: ctx.now,
            lastCheckedAt: ctx.now,
            failureReason: null,
          },
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true, session: dbSession },
      ).lean();

      await recordActivity({
        userId: ctx.actor.id,
        type: ACTIVITY_TYPES.PROBLEM_SOLVED,
        refId: problem._id,
        occurredAt: solvedAt,
        session: dbSession,
      });

      return doc;
    });

    return {
      result: "solved",
      problem: toProblemProgressDto(problem, updated),
    };
  }

  // Keep existing solved verification intact if already solved previously.
  if (existingVerif?.status === "solved") {
    const updated = await ProblemVerification.findByIdAndUpdate(
      existingVerif._id,
      { $set: { lastCheckedAt: ctx.now }, $inc: { attempts: 1 } },
      { new: true },
    ).lean();
    return {
      result: "solved",
      problem: toProblemProgressDto(problem, updated),
    };
  }

  const failed = await ProblemVerification.findOneAndUpdate(
    { userId: ctx.actor.id, problemId: problem._id },
    {
      $set: {
        status: "failed",
        platform: problem.platform,
        solvedAt: null,
        lastCheckedAt: ctx.now,
        failureReason: "No accepted Codeforces submission found for this problem yet.",
      },
      $inc: { attempts: 1 },
    },
    { upsert: true, new: true },
  ).lean();

  return {
    result: "failed",
    message: "No accepted submission found yet on Codeforces.",
    problem: toProblemProgressDto(problem, failed),
  };
}

// ---- Admin Progress ----
export async function listProgressByStudent(ctx, { page = 1, limit = 20, q } = {}) {
  await connectDb();
  const filter = { role: "student" };
  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const skip = (page - 1) * limit;
  const [students, totalStudents, publishedProblems] = await Promise.all([
    User.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
    Problem.find({ status: "published", deletedAt: null }).select("_id").lean(),
  ]);

  const publishedIds = publishedProblems.map((p) => p._id);
  const studentIds = students.map((s) => s._id);

  const solvedAgg =
    studentIds.length && publishedIds.length
      ? await ProblemVerification.aggregate([
          {
            $match: {
              userId: { $in: studentIds },
              problemId: { $in: publishedIds },
              status: "solved",
            },
          },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
        ])
      : [];

  const solvedByUser = new Map(solvedAgg.map((row) => [String(row._id), row.count]));

  return paginated(
    students.map((s) => ({
      userId: String(s._id),
      name: s.name,
      solved: solvedByUser.get(String(s._id)) ?? 0,
      total: publishedIds.length,
    })),
    totalStudents,
    { page, limit },
  );
}

export async function getStudentProgress(ctx, userId, { page = 1, limit = 50 } = {}) {
  await connectDb();
  const student = await User.findById(userId).lean();
  if (!student) throw new AppError("NOT_FOUND");

  const filter = { status: "published", deletedAt: null };
  const skip = (page - 1) * limit;
  const [problems, total] = await Promise.all([
    Problem.find(filter).sort({ createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    Problem.countDocuments(filter),
  ]);

  const verifs = problems.length
    ? await ProblemVerification.find({
        userId: student._id,
        problemId: { $in: problems.map((p) => p._id) },
      }).lean()
    : [];
  const verifMap = new Map(verifs.map((v) => [String(v.problemId), v]));

  return paginated(
    problems.map((p) => toProblemProgressDto(p, verifMap.get(String(p._id)) ?? null)),
    total,
    { page, limit },
  );
}
