import { getEnv } from "@/lib/config/env.js";
import { campusDay } from "@/lib/config/time.js";
import { connectDb } from "@/lib/db/connect.js";
import { ActivityEvent } from "@/models/ActivityEvent.js";
import { Team } from "@/models/Team.js";
import { TeamMembership } from "@/models/TeamMembership.js";

const WEEKS = 18;
const DAYS_IN_GRID = WEEKS * 7;

function buildCalendarCells(countsByDay, now) {
  const cells = [];
  for (let offset = DAYS_IN_GRID - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getTime() - offset * 86400000);
    const day = campusDay(d);
    const count = countsByDay.get(day) ?? 0;
    let level = 0;
    if (count === 1) level = 1;
    else if (count === 2) level = 2;
    else if (count === 3) level = 3;
    else if (count >= 4) level = 4;
    cells.push({ date: day, level, count });
  }
  return cells;
}

function computeStreaks(daySet, now) {
  const today = campusDay(now);
  const yesterday = campusDay(new Date(now.getTime() - 86400000));

  let current = 0;
  let cursorOffset = daySet.has(today) ? 0 : daySet.has(yesterday) ? 1 : -1;
  if (cursorOffset >= 0) {
    while (true) {
      const day = campusDay(new Date(now.getTime() - cursorOffset * 86400000));
      if (!daySet.has(day)) break;
      current += 1;
      cursorOffset += 1;
    }
  }

  const sortedDays = [...daySet].sort();
  let longest = 0;
  let run = 0;
  let prevMs = null;
  for (const d of sortedDays) {
    const ms = Date.parse(`${d}T00:00:00Z`);
    if (prevMs !== null && ms - prevMs === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prevMs = ms;
  }

  return { current, longest, activeDays: daySet.size };
}

function summarizeEvents(events, now) {
  const countsByDay = new Map();
  for (const ev of events) {
    countsByDay.set(ev.day, (countsByDay.get(ev.day) ?? 0) + 1);
  }
  const daySet = new Set(countsByDay.keys());
  const stats = computeStreaks(daySet, now);
  return {
    ...stats,
    cells: buildCalendarCells(countsByDay, now),
  };
}

export async function getStreak(ctx) {
  const streakConfig = getEnv().streak;
  const qualifyingTypes = streakConfig?.qualifyingTypes ?? null;
  if (!qualifyingTypes || qualifyingTypes.length === 0) {
    return { enabled: false, individual: null, team: null };
  }

  await connectDb();
  const now = ctx.now ?? new Date();
  const [individualEvents, membership] = await Promise.all([
    ActivityEvent.find({
      userId: ctx.actor.id,
      type: { $in: qualifyingTypes },
    }).lean(),
    TeamMembership.findOne({ userId: ctx.actor.id, status: "active" }).lean(),
  ]);

  const individual = summarizeEvents(individualEvents, now);

  let team = null;
  if (membership) {
    const [teamDoc, teamMembers] = await Promise.all([
      Team.findOne({ _id: membership.teamId, status: "active", deletedAt: null }).lean(),
      TeamMembership.find({ teamId: membership.teamId, status: "active" })
        .select("userId")
        .lean(),
    ]);
    if (teamDoc) {
      const memberIds = teamMembers.map((m) => m.userId);
      const teamEvents = await ActivityEvent.find({
        type: { $in: qualifyingTypes },
        $or: [
          { teamId: teamDoc._id },
          { userId: { $in: memberIds } },
        ],
      }).lean();
      team = {
        teamId: String(teamDoc._id),
        teamName: teamDoc.name,
        ...summarizeEvents(teamEvents, now),
      };
    }
  }

  return {
    enabled: true,
    individual,
    team,
  };
}
