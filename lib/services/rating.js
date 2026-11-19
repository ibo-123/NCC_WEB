import { connectDb } from "@/lib/db/connect.js";
import { paginated } from "@/lib/http/pagination.js";
import { RatingHistory } from "@/models/RatingHistory.js";
import { User } from "@/models/User.js";

export function toRatingEntryDto(doc) {
  return {
    id: String(doc._id),
    value: doc.value,
    previous: doc.previous ?? null,
    change: doc.change ?? null,
    source: doc.source,
    components: doc.components
      ? {
          problem: doc.components.problem ?? null,
          contest: doc.components.contest ?? null,
          attendance: doc.components.attendance ?? null,
        }
      : null,
    computedAt: new Date(doc.computedAt).toISOString(),
    formulaVersion: doc.formulaVersion ?? null,
  };
}

export async function getMyRating(ctx) {
  await connectDb();
  const [user, latest] = await Promise.all([
    User.findById(ctx.actor.id).select("ratingCurrent").lean(),
    RatingHistory.findOne({ userId: ctx.actor.id }).sort({ computedAt: -1, _id: -1 }).lean(),
  ]);

  if (!latest) {
    return {
      value: user?.ratingCurrent ?? null,
      components: null,
      computedAt: null,
      formulaVersion: null,
    };
  }

  return {
    value: latest.value,
    components: latest.components ?? null,
    computedAt: new Date(latest.computedAt).toISOString(),
    formulaVersion: latest.formulaVersion ?? null,
  };
}

export async function listRatingHistory(ctx, { page = 1, limit = 20 } = {}) {
  await connectDb();
  const filter = { userId: ctx.actor.id };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    RatingHistory.find(filter).sort({ computedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    RatingHistory.countDocuments(filter),
  ]);
  return paginated(rows.map(toRatingEntryDto), total, { page, limit });
}

export async function listAdminRating(ctx, { page = 1, limit = 20 } = {}) {
  await connectDb();
  const filter = { role: "student" };
  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    User.find(filter).sort({ ratingCurrent: -1, name: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const studentIds = students.map((s) => s._id);
  const latestRows = studentIds.length
    ? await RatingHistory.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $sort: { computedAt: -1, _id: -1 } },
        {
          $group: {
            _id: "$userId",
            computedAt: { $first: "$computedAt" },
            change: { $first: "$change" },
            previous: { $first: "$previous" },
          },
        },
      ])
    : [];
  const latestByUser = new Map(
    latestRows.map((r) => [
      String(r._id),
      {
        computedAt: new Date(r.computedAt).toISOString(),
        change: r.change ?? null,
        previous: r.previous ?? null,
      },
    ]),
  );

  return paginated(
    students.map((s) => {
      const latest = latestByUser.get(String(s._id)) ?? null;
      return {
        userId: String(s._id),
        name: s.name,
        rating: s.ratingCurrent ?? null,
        computedAt: latest?.computedAt ?? null,
        change: latest?.change ?? null,
        previous: latest?.previous ?? null,
      };
    }),
    total,
    { page, limit },
  );
}
