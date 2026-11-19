import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

const { connectDb, disconnectDb } = await import("../lib/db/connect.js");
const { hashPassword } = await import("../lib/auth/password.js");
const { AEAD_PURPOSES, encrypt } = await import("../lib/security/aead.js");
const { campusDay } = await import("../lib/config/time.js");

const { User } = await import("../models/User.js");
const { Session } = await import("../models/Session.js");
const { Topic } = await import("../models/Topic.js");
const { Problem } = await import("../models/Problem.js");
const { ProblemVerification } = await import("../models/ProblemVerification.js");
const { Lecture } = await import("../models/Lecture.js");
const { AttendanceSession } = await import("../models/AttendanceSession.js");
const { AttendanceRecord } = await import("../models/AttendanceRecord.js");
const { Contest } = await import("../models/Contest.js");
const { ContestResult } = await import("../models/ContestResult.js");
const { Team } = await import("../models/Team.js");
const { TeamMembership } = await import("../models/TeamMembership.js");
const { TeamContestResult } = await import("../models/TeamContestResult.js");
const { RatingHistory } = await import("../models/RatingHistory.js");
const { ActivityEvent } = await import("../models/ActivityEvent.js");
const { Announcement } = await import("../models/Announcement.js");
const { Notification } = await import("../models/Notification.js");
const { AuditLog } = await import("../models/AuditLog.js");
const { RateLimit } = await import("../models/RateLimit.js");

async function upsertByFilter(Model, filter, doc) {
  const existing = await Model.findOne(filter);
  if (existing) return existing;
  return Model.create(doc);
}

async function seed() {
  await connectDb();

  // Ensure indexes exist across all 19 collections
  await Promise.all([
    User.syncIndexes(),
    Session.syncIndexes(),
    Topic.syncIndexes(),
    Problem.syncIndexes(),
    ProblemVerification.syncIndexes(),
    Lecture.syncIndexes(),
    AttendanceSession.syncIndexes(),
    AttendanceRecord.syncIndexes(),
    Contest.syncIndexes(),
    ContestResult.syncIndexes(),
    Team.syncIndexes(),
    TeamMembership.syncIndexes(),
    TeamContestResult.syncIndexes(),
    RatingHistory.syncIndexes(),
    ActivityEvent.syncIndexes(),
    Announcement.syncIndexes(),
    Notification.syncIndexes(),
    AuditLog.syncIndexes(),
    RateLimit.syncIndexes(),
  ]);

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
  const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "marta.alemu@ncc.edu").trim().toLowerCase();
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "adminpass123";
  const studentPassHash = await hashPassword("studentpass123");
  const adminPassHash = await hashPassword(adminPass);

  const marta = await upsertByFilter(
    User,
    { email: adminEmail },
    {
      name: "Marta Alemu",
      email: adminEmail,
      passwordHash: adminPassHash,
      role: "admin",
      status: "active",
      ratingCurrent: null,
      lastLoginAt: daysAgo(0),
    },
  );

  const studentSpecs = [
    {
      name: "Ibrahim Kedir",
      email: "ibrahim.kedir@ncc.edu",
      handles: { codeforces: "ibrahimkediramdela2211", leetcode: "ibro_man" },
      ratingCurrent: 4.27,
    },
    {
      name: "Hana Tesfaye",
      email: "hana.tesfaye@ncc.edu",
      handles: { codeforces: "hana_t", leetcode: "hana_lc" },
      ratingCurrent: 4.62,
    },
    {
      name: "Yonas Alemu",
      email: "yonas.alemu@ncc.edu",
      handles: { codeforces: "yonas_a", leetcode: "yonas_lc" },
      ratingCurrent: 4.41,
    },
    {
      name: "Meron Bekele",
      email: "meron.bekele@ncc.edu",
      handles: { codeforces: "meron_b" },
      ratingCurrent: 3.88,
    },
    {
      name: "Liya Mekonnen",
      email: "liya.mekonnen@ncc.edu",
      status: "restricted",
      restrictedAt: daysAgo(10),
      restrictedReason: "Rating fell below threshold during term review.",
      handles: { codeforces: "liya_m" },
      ratingCurrent: 1.84,
    },
    {
      name: "Dawit Haile",
      email: "dawit.haile@ncc.edu",
      handles: { codeforces: "dawit_h", leetcode: "dawit_lc" },
      ratingCurrent: 3.54,
    },
    {
      name: "Sara Mohammed",
      email: "sara.mohammed@ncc.edu",
      handles: { codeforces: "sara_m" },
      ratingCurrent: 4.05,
    },
  ];

  const users = { marta };
  for (const spec of studentSpecs) {
    const u = await upsertByFilter(
      User,
      { email: spec.email },
      {
        name: spec.name,
        email: spec.email,
        passwordHash: studentPassHash,
        role: "student",
        status: spec.status ?? "active",
        restrictedAt: spec.restrictedAt ?? null,
        restrictedReason: spec.restrictedReason ?? null,
        handles: spec.handles,
        ratingCurrent: spec.ratingCurrent,
        lastLoginAt: daysAgo(1),
      },
    );
    users[spec.email.split(".")[0]] = u;
  }

  // Topics
  const topicSpecs = [
    { name: "Arrays", slug: "arrays", order: 1 },
    { name: "Binary Search", slug: "binary-search", order: 2 },
    { name: "Dynamic Programming", slug: "dynamic-programming", order: 3 },
    { name: "Graphs", slug: "graphs", order: 4 },
    { name: "Mathematics", slug: "mathematics", order: 5 },
  ];
  const topics = {};
  for (const t of topicSpecs) {
    const doc = await upsertByFilter(Topic, { slug: t.slug, deletedAt: null }, t);
    topics[t.slug] = doc;
  }

  // Problems
  const problemSpecs = [
    { title: "Frog Jumps", topicSlug: "dynamic-programming", platform: "codeforces", value: 5, url: "https://codeforces.com/problemset/problem/1324/C", externalRef: { contestId: 1324, index: "C" } },
    { title: "0/1 Knapsack", topicSlug: "dynamic-programming", platform: "codeforces", value: 10, url: "https://codeforces.com/problemset/problem/148/E", externalRef: { contestId: 148, index: "E" } },
    { title: "LIS Basics", topicSlug: "dynamic-programming", platform: "leetcode", value: 8, url: "https://leetcode.com/problems/longest-increasing-subsequence/", externalRef: { titleSlug: "longest-increasing-subsequence" } },
    { title: "Grid Paths", topicSlug: "dynamic-programming", platform: "codeforces", value: 12, url: "https://codeforces.com/problemset/problem/1638/C", externalRef: { contestId: 1638, index: "C" } },
    { title: "Prefix Sum Range", topicSlug: "arrays", platform: "codeforces", value: 5, url: "https://codeforces.com/problemset/problem/433/B", externalRef: { contestId: 433, index: "B" } },
    { title: "Sliding Window Max", topicSlug: "arrays", platform: "leetcode", value: 8, url: "https://leetcode.com/problems/sliding-window-maximum/", externalRef: { titleSlug: "sliding-window-maximum" } },
    { title: "First True Predicate", topicSlug: "binary-search", platform: "codeforces", value: 6, url: "https://codeforces.com/problemset/problem/1201/C", externalRef: { contestId: 1201, index: "C" } },
    { title: "Search on Answer", topicSlug: "binary-search", platform: "codeforces", value: 10, url: "https://codeforces.com/problemset/problem/1613/C", externalRef: { contestId: 1613, index: "C" } },
    { title: "BFS Shortest Path", topicSlug: "graphs", platform: "codeforces", value: 7, url: "https://codeforces.com/problemset/problem/59/E", externalRef: { contestId: 59, index: "E" } },
    { title: "Cycle Detection", topicSlug: "graphs", platform: "leetcode", value: 9, url: "https://leetcode.com/problems/course-schedule/", externalRef: { titleSlug: "course-schedule" } },
    { title: "Modular Exponent", topicSlug: "mathematics", platform: "codeforces", value: 6, url: "https://codeforces.com/problemset/problem/630/I", externalRef: { contestId: 630, index: "I" } },
    { title: "GCD Applications", topicSlug: "mathematics", platform: "codeforces", value: 5, url: "https://codeforces.com/problemset/problem/1370/A", externalRef: { contestId: 1370, index: "A" } },
  ];
  const problems = {};
  for (const p of problemSpecs) {
    const doc = await upsertByFilter(
      Problem,
      { title: p.title, deletedAt: null },
      {
        title: p.title,
        topicId: topics[p.topicSlug]._id,
        platform: p.platform,
        value: p.value,
        url: p.url,
        externalRef: p.externalRef,
        status: "published",
      },
    );
    problems[p.title] = doc;
  }

  // Problem verifications for Ibrahim & Hana & Liya
  const verifSeeds = [
    { user: users.ibrahim, problem: problems["Frog Jumps"], status: "solved", solvedAt: daysAgo(12) },
    { user: users.ibrahim, problem: problems["Prefix Sum Range"], status: "solved", solvedAt: daysAgo(20) },
    { user: users.ibrahim, problem: problems["First True Predicate"], status: "solved", solvedAt: daysAgo(9) },
    { user: users.ibrahim, problem: problems["BFS Shortest Path"], status: "solved", solvedAt: daysAgo(4) },
    { user: users.ibrahim, problem: problems["Modular Exponent"], status: "solved", solvedAt: daysAgo(2) },
    { user: users.hana, problem: problems["Frog Jumps"], status: "solved", solvedAt: daysAgo(13) },
    { user: users.hana, problem: problems["0/1 Knapsack"], status: "solved", solvedAt: daysAgo(8) },
    { user: users.hana, problem: problems["Prefix Sum Range"], status: "solved", solvedAt: daysAgo(19) },
    { user: users.liya, problem: problems["Prefix Sum Range"], status: "solved", solvedAt: daysAgo(17) },
  ];
  for (const v of verifSeeds) {
    await upsertByFilter(
      ProblemVerification,
      { userId: v.user._id, problemId: v.problem._id },
      {
        userId: v.user._id,
        problemId: v.problem._id,
        status: v.status,
        platform: v.problem.platform,
        solvedAt: v.solvedAt,
        verifiedAt: v.solvedAt,
        lastCheckedAt: v.solvedAt,
        attempts: 1,
      },
    );
    await upsertByFilter(
      ActivityEvent,
      { userId: v.user._id, type: "problem_solved", refId: v.problem._id },
      {
        userId: v.user._id,
        type: "problem_solved",
        refId: v.problem._id,
        occurredAt: v.solvedAt,
        day: campusDay(v.solvedAt),
      },
    );
  }

  // Lectures
  const lec1 = await upsertByFilter(
    Lecture,
    { title: "Binary Search Patterns", deletedAt: null },
    {
      title: "Binary Search Patterns",
      description: "Lower bound, upper bound, and the predicate form used in contest problems.",
      scheduledAt: daysAgo(0),
      liveUrl: "https://meet.ncc.edu/binary-search",
      status: "published",
      resources: [
        { title: "Lecture slides", type: "pdf", url: "https://docs.ncc.edu/binary-search-slides.pdf" },
        { title: "Practice sheet", type: "link", url: "https://codeforces.com/problemset?tags=binary+search" },
        { title: "Sample code", type: "file", url: "https://docs.ncc.edu/binary-search-templates.cpp" },
      ],
    },
  );
  const lec2 = await upsertByFilter(
    Lecture,
    { title: "Introduction to Dynamic Programming", deletedAt: null },
    {
      title: "Introduction to Dynamic Programming",
      description: "States, transitions, and how to read a DP problem before coding.",
      scheduledAt: daysFromNow(4),
      liveUrl: "https://meet.ncc.edu/intro-dp",
      status: "published",
      resources: [
        { title: "DP state design slides", type: "pdf", url: "https://docs.ncc.edu/dp-intro.pdf" },
        { title: "Starter problems", type: "link", url: "https://codeforces.com/problemset?tags=dp" },
      ],
    },
  );
  const lec3 = await upsertByFilter(
    Lecture,
    { title: "Graph Traversal Workshop", deletedAt: null },
    {
      title: "Graph Traversal Workshop",
      description: "BFS, DFS, and when each one is the right first move.",
      scheduledAt: daysFromNow(5),
      liveUrl: "https://meet.ncc.edu/graph-workshop",
      status: "published",
      resources: [
        { title: "Graph traversal notes", type: "pdf", url: "https://docs.ncc.edu/graphs.pdf" },
      ],
    },
  );
  const lec4 = await upsertByFilter(
    Lecture,
    { title: "Arrays and Prefix Sums", deletedAt: null },
    {
      title: "Arrays and Prefix Sums",
      description: "Prefix sums, difference arrays, and common contest patterns.",
      scheduledAt: daysAgo(7),
      liveUrl: "https://meet.ncc.edu/prefix-sums",
      status: "published",
      resources: [
        { title: "Prefix sums slides", type: "pdf", url: "https://docs.ncc.edu/prefix-sums.pdf" },
        { title: "Sample code", type: "file", url: "https://docs.ncc.edu/prefix-sums.cpp" },
      ],
    },
  );

  // Open attendance session for lec1 with encrypted code "4837"
  let openSess = await AttendanceSession.findOne({ lectureId: lec1._id, closedAt: null });
  if (!openSess) {
    const sessId = new mongoose.Types.ObjectId();
    openSess = await AttendanceSession.create({
      _id: sessId,
      lectureId: lec1._id,
      codeEnc: encrypt(AEAD_PURPOSES.ATTENDANCE_CODE, String(sessId), "4837"),
      openedBy: marta._id,
      opensAt: new Date(now.getTime() - 10 * 60000),
      expiresAt: daysFromNow(30),
      closedAt: null,
    });
    for (const attendee of [users.hana, users.yonas]) {
      await upsertByFilter(
        AttendanceRecord,
        { sessionId: openSess._id, userId: attendee._id },
        {
          sessionId: openSess._id,
          lectureId: lec1._id,
          userId: attendee._id,
          submittedAt: new Date(now.getTime() - 5 * 60000),
        },
      );
    }
  }

  let closedSess1 = await AttendanceSession.findOne({ lectureId: lec4._id, closedAt: { $ne: null } });
  if (!closedSess1) {
    closedSess1 = await AttendanceSession.create({
      lectureId: lec4._id,
      codeEnc: null,
      openedBy: marta._id,
      opensAt: daysAgo(7),
      expiresAt: new Date(daysAgo(7).getTime() + 15 * 60000),
      closedAt: new Date(daysAgo(7).getTime() + 15 * 60000),
    });
    for (const attendee of [users.ibrahim, users.hana, users.yonas]) {
      await upsertByFilter(
        AttendanceRecord,
        { sessionId: closedSess1._id, userId: attendee._id },
        {
          sessionId: closedSess1._id,
          lectureId: lec4._id,
          userId: attendee._id,
          submittedAt: daysAgo(7),
        },
      );
      await upsertByFilter(
        ActivityEvent,
        { userId: attendee._id, type: "attendance", refId: closedSess1._id },
        {
          userId: attendee._id,
          type: "attendance",
          refId: closedSess1._id,
          occurredAt: daysAgo(7),
          day: campusDay(daysAgo(7)),
        },
      );
    }
  }

  // Teams
  const team1 = await upsertByFilter(
    Team,
    { slug: "binary-hawks", deletedAt: null },
    {
      name: "Binary Hawks",
      slug: "binary-hawks",
      inviteCode: "HAWK7K2M",
      captainId: users.ibrahim._id,
      status: "active",
      memberCount: 4,
      streakCurrent: 8,
      streakLongest: 14,
    },
  );
  for (const [u, role] of [
    [users.ibrahim, "captain"],
    [users.hana, "member"],
    [users.yonas, "member"],
    [users.meron, "member"],
  ]) {
    await upsertByFilter(
      TeamMembership,
      { teamId: team1._id, userId: u._id },
      { teamId: team1._id, userId: u._id, role, status: "active", joinedAt: daysAgo(35) },
    );
  }

  const team2 = await upsertByFilter(
    Team,
    { slug: "stack-overflowers", deletedAt: null },
    {
      name: "Stack Overflowers",
      slug: "stack-overflowers",
      inviteCode: "STCK9P4R",
      captainId: users.dawit._id,
      status: "active",
      memberCount: 2,
      streakCurrent: 11,
      streakLongest: 16,
    },
  );
  for (const [u, role] of [
    [users.dawit, "captain"],
    [users.sara, "member"],
  ]) {
    await upsertByFilter(
      TeamMembership,
      { teamId: team2._id, userId: u._id },
      { teamId: team2._id, userId: u._id, role, status: "active", joinedAt: daysAgo(34) },
    );
  }

  // Contests
  const con1 = await upsertByFilter(
    Contest,
    { title: "NCC_DSA Weekly Contest #04", deletedAt: null },
    {
      title: "NCC_DSA Weekly Contest #04",
      description: "A weekly NCC_DSA round. Standings are fetched from Codeforces after the contest and then published here.",
      mode: "individual",
      platform: "codeforces",
      platformContestId: "123456",
      url: "https://codeforces.com/contest/123456",
      invitationUrl: "https://codeforces.com/contest/123456",
      startsAt: daysFromNow(6),
      durationMinutes: 120,
      publication: "published",
      resultsState: "not_fetched",
    },
  );
  const con2 = await upsertByFilter(
    Contest,
    { title: "NCC_DSA Weekly Contest #03", deletedAt: null },
    {
      title: "NCC_DSA Weekly Contest #03",
      description: "Weekly individual Codeforces round covering binary search and greedy constructions.",
      mode: "individual",
      platform: "codeforces",
      platformContestId: "123401",
      url: "https://codeforces.com/contest/123401",
      invitationUrl: "https://codeforces.com/contest/123401",
      startsAt: daysAgo(5),
      durationMinutes: 120,
      publication: "published",
      resultsState: "published",
      lastFetchedAt: daysAgo(4),
      fetchSummary: { processed: 42, matched: 7, unmatchedHandles: ["tourist_x", "new_handle_22", "guest_904"] },
    },
  );
  const con3 = await upsertByFilter(
    Contest,
    { title: "NCC_DSA Summer Time Tournament", deletedAt: null },
    {
      title: "NCC_DSA Summer Time Tournament",
      description: "End-of-summer Codeforces invitational round.",
      mode: "individual",
      platform: "codeforces",
      platformContestId: "118820",
      url: "https://codeforces.com/contest/118820",
      invitationUrl: "https://codeforces.com/contest/118820",
      startsAt: daysAgo(30),
      durationMinutes: 180,
      publication: "published",
      resultsState: "published",
      lastFetchedAt: daysAgo(29),
      fetchSummary: { processed: 38, matched: 3, unmatchedHandles: ["guest_10", "guest_11"] },
    },
  );
  await upsertByFilter(
    Contest,
    { title: "Team Week #06 — Graphs", deletedAt: null },
    {
      title: "Team Week #06 — Graphs",
      description: "Week-long Group competition. Standings are fetched from Codeforces after the window ends.",
      mode: "team",
      platform: "codeforces",
      platformContestId: "124100",
      url: "https://codeforces.com/contest/124100",
      invitationUrl: "https://codeforces.com/contest/124100",
      startsAt: daysAgo(2),
      durationMinutes: 10080,
      publication: "published",
      resultsState: "not_fetched",
    },
  );
  const conTeam3 = await upsertByFilter(
    Contest,
    { title: "Team Week #05 — Binary Search", deletedAt: null },
    {
      title: "Team Week #05 — Binary Search",
      description: "Completed week-long Group contest with derived team rankings.",
      mode: "team",
      platform: "codeforces",
      platformContestId: "124000",
      url: "https://codeforces.com/contest/124000",
      invitationUrl: "https://codeforces.com/contest/124000",
      startsAt: daysAgo(12),
      durationMinutes: 10080,
      publication: "published",
      resultsState: "published",
      lastFetchedAt: daysAgo(5),
      fetchSummary: { processed: 24, matched: 6, unmatchedHandles: ["cf_guest_1"], teamsMatched: 2 },
    },
  );

  // ContestResults
  const con2Rows = [
    [users.hana, "hana_t", 1, 1280, 210],
    [users.yonas, "yonas_a", 2, 1210, 340],
    [users.meron, "meron_b", 3, 1104, 510],
    [users.dawit, "dawit_h", 4, 980, 640],
    [users.sara, "sara_m", 5, 940, 700],
    [users.ibrahim, "ibrahimkediramdela2211", 12, 742, 1240],
    [users.liya, "liya_m", 18, 420, 1580],
  ];
  for (const [u, handle, rank, points, penalty] of con2Rows) {
    await upsertByFilter(
      ContestResult,
      { contestId: con2._id, userId: u._id },
      { contestId: con2._id, userId: u._id, handle, rank, points, penalty, fetchedAt: daysAgo(4) },
    );
  }
  for (const [u, handle, rank, points, penalty] of [
    [users.hana, "hana_t", 1, 1410, 190],
    [users.ibrahim, "ibrahimkediramdela2211", 4, 1120, 430],
    [users.yonas, "yonas_a", 5, 1090, 470],
  ]) {
    await upsertByFilter(
      ContestResult,
      { contestId: con3._id, userId: u._id },
      { contestId: con3._id, userId: u._id, handle, rank, points, penalty, fetchedAt: daysAgo(29) },
    );
  }
  for (const [u, handle, rank, points, penalty] of [
    [users.ibrahim, "ibrahimkediramdela2211", 1, 820, 210],
    [users.hana, "hana_t", 2, 790, 180],
    [users.yonas, "yonas_a", 3, 720, 240],
    [users.meron, "meron_b", 4, 510, 300],
    [users.dawit, "dawit_h", 5, 1410, 190],
    [users.sara, "sara_m", 6, 1200, 240],
  ]) {
    await upsertByFilter(
      ContestResult,
      { contestId: conTeam3._id, userId: u._id },
      { contestId: conTeam3._id, userId: u._id, handle, rank, points, penalty, fetchedAt: daysAgo(5) },
    );
  }
  await upsertByFilter(
    TeamContestResult,
    { contestId: conTeam3._id, teamId: team1._id },
    { contestId: conTeam3._id, teamId: team1._id, rank: 1, points: 2840, penalty: 930, memberCount: 4, matchedMembers: 4, fetchedAt: daysAgo(5) },
  );
  await upsertByFilter(
    TeamContestResult,
    { contestId: conTeam3._id, teamId: team2._id },
    { contestId: conTeam3._id, teamId: team2._id, rank: 2, points: 2610, penalty: 430, memberCount: 2, matchedMembers: 2, fetchedAt: daysAgo(5) },
  );

  // Rating History
  if ((await RatingHistory.countDocuments({ userId: users.ibrahim._id })) === 0) {
    await RatingHistory.insertMany([
      { userId: users.ibrahim._id, previous: null, value: 3.2, change: null, source: "initial", components: { problem: 3.2, contest: 3.2, attendance: 3.2 }, runId: "seed-1", computedAt: daysAgo(42), formulaVersion: "v1-preview" },
      { userId: users.ibrahim._id, previous: 3.2, value: 3.45, change: 0.25, source: "scheduled", components: { problem: 3.4, contest: 3.3, attendance: 3.8 }, runId: "seed-2", computedAt: daysAgo(35), formulaVersion: "v1-preview" },
      { userId: users.ibrahim._id, previous: 3.45, value: 3.9, change: 0.45, source: "scheduled", components: { problem: 3.9, contest: 3.8, attendance: 4.1 }, runId: "seed-3", computedAt: daysAgo(28), formulaVersion: "v1-preview" },
      { userId: users.ibrahim._id, previous: 3.9, value: 3.72, change: -0.18, source: "scheduled", components: { problem: 3.8, contest: 3.6, attendance: 4.2 }, runId: "seed-4", computedAt: daysAgo(21), formulaVersion: "v1-preview" },
      { userId: users.ibrahim._id, previous: 3.72, value: 4.05, change: 0.33, source: "scheduled", components: { problem: 4.1, contest: 4.0, attendance: 4.4 }, runId: "seed-5", computedAt: daysAgo(14), formulaVersion: "v1-preview" },
      { userId: users.ibrahim._id, previous: 4.05, value: 3.95, change: -0.1, source: "scheduled", components: { problem: 4.2, contest: 3.7, attendance: 4.5 }, runId: "seed-6", computedAt: daysAgo(7), formulaVersion: "v1-preview" },
      { userId: users.ibrahim._id, previous: 3.95, value: 4.27, change: 0.32, source: "scheduled", components: { problem: 4.5, contest: 4.1, attendance: 4.7 }, runId: "seed-7", computedAt: daysAgo(1), formulaVersion: "v1-preview" },
    ]);
  }
  if ((await RatingHistory.countDocuments({ userId: users.hana._id })) === 0) {
    await RatingHistory.create({
      userId: users.hana._id,
      previous: 4.48,
      value: 4.62,
      change: 0.14,
      source: "scheduled",
      components: { problem: 4.8, contest: 4.4, attendance: 4.7 },
      runId: "seed-7",
      computedAt: daysAgo(1),
      formulaVersion: "v1-preview",
    });
  }
  if ((await RatingHistory.countDocuments({ userId: users.liya._id })) === 0) {
    await RatingHistory.create({
      userId: users.liya._id,
      previous: 1.92,
      value: 1.84,
      change: -0.08,
      source: "scheduled",
      components: { problem: 1.6, contest: 1.9, attendance: 2.1 },
      runId: "seed-6",
      computedAt: daysAgo(10),
      formulaVersion: "v1-preview",
    });
  }

  // Additional recent streak activity days for Ibrahim (7-day active streak!)
  for (let d = 0; d < 7; d += 1) {
    const dt = daysAgo(d);
    await upsertByFilter(
      ActivityEvent,
      { userId: users.ibrahim._id, type: "contest_result", refId: new mongoose.Types.ObjectId(String(d + 1).padStart(24, "a")) },
      {
        userId: users.ibrahim._id,
        type: "contest_result",
        refId: new mongoose.Types.ObjectId(String(d + 1).padStart(24, "a")),
        teamId: team1._id,
        occurredAt: dt,
        day: campusDay(dt),
      },
    );
  }

  // Announcements
  const annSeeds = [
    {
      title: "Summer tournament seating",
      body: "Arrive 20 minutes early for NCC_DSA Summer Time Tournament check-in. Bring the Codeforces handle linked on your profile.",
      type: "important",
      status: "published",
      publishedAt: daysAgo(2),
    },
    {
      title: "Weekly Contest #04 invitation",
      body: "You are invited to NCC_DSA Weekly Contest #04 on Sunday at 3:30 PM. The contest runs on Codeforces.",
      type: "contest",
      status: "published",
      publishedAt: daysAgo(3),
    },
    {
      title: "Dynamic programming lecture notes",
      body: "Slides and the practice sheet for Introduction to Dynamic Programming are on the lecture page.",
      type: "lecture",
      status: "published",
      publishedAt: daysAgo(5),
    },
    {
      title: "Attendance window reminder",
      body: "Attendance codes are valid only while the session is open. Submit the 4-digit code from the lecture room.",
      type: "attendance",
      status: "published",
      publishedAt: daysAgo(7),
    },
    {
      title: "Draft: Mid-term rating review window",
      body: "Draft notes for instructors ahead of the mid-term check-in.",
      type: "general",
      status: "draft",
      publishedAt: null,
    },
  ];
  for (const a of annSeeds) {
    await upsertByFilter(
      Announcement,
      { title: a.title, deletedAt: null },
      { ...a, createdBy: marta._id },
    );
  }

  // Notifications for Ibrahim
  if ((await Notification.countDocuments({ userId: users.ibrahim._id })) === 0) {
    await Notification.insertMany([
      {
        userId: users.ibrahim._id,
        type: "announcement_published",
        title: "Announcement published",
        body: "Summer tournament seating was published.",
        href: "/announcements",
        createdAt: daysAgo(2),
      },
      {
        userId: users.ibrahim._id,
        type: "contest_published",
        title: "Contest published",
        body: "NCC_DSA Weekly Contest #04 is scheduled on Codeforces.",
        href: `/contests/${con1._id}`,
        createdAt: daysAgo(3),
      },
      {
        userId: users.ibrahim._id,
        type: "attendance_recorded",
        title: "Attendance recorded",
        body: "Attendance recorded for Arrays and Prefix Sums.",
        href: "/attendance",
        createdAt: daysAgo(7),
      },
    ]);
  }

  // Audit Log baseline
  if ((await AuditLog.countDocuments()) === 0) {
    await AuditLog.insertMany([
      { actorId: marta._id, action: "lecture.publish", entityType: "Lecture", entityId: lec1._id, summary: "Published lecture Binary Search Patterns", correlationId: "seed-aud-1", createdAt: daysAgo(0) },
      { actorId: marta._id, action: "results.publish", entityType: "Contest", entityId: conTeam3._id, summary: "Published Team Week #05 — Binary Search standings", correlationId: "seed-aud-2", createdAt: daysAgo(1) },
      { actorId: marta._id, action: "results.fetch", entityType: "Contest", entityId: con2._id, summary: "Fetched Codeforces standings for Weekly Contest #03 · 42 participants", correlationId: "seed-aud-3", createdAt: daysAgo(4) },
      { actorId: marta._id, action: "announcement.publish", entityType: "Announcement", entityId: null, summary: "Published announcement Summer tournament seating", correlationId: "seed-aud-4", createdAt: daysAgo(2) },
      { actorId: marta._id, action: "user.restrict", entityType: "User", entityId: users.liya._id, summary: "Restricted account Liya Mekonnen", correlationId: "seed-aud-5", createdAt: daysAgo(10) },
    ]);
  }

  console.log("Seeded MongoDB database ncc_dsa successfully.");
  await disconnectDb();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
