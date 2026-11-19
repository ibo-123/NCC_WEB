import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password.js";
import {
  createContest,
  fetchResults,
  listResults,
  publishContest,
  publishResults,
} from "@/lib/services/contests.js";
import {
  checkSolve,
  createProblem,
  createTopic,
  deleteProblem,
  deleteTopic,
  isSolveEligible,
  publishProblem,
} from "@/lib/services/progress.js";
import {
  createTeam,
  disbandTeam,
  joinTeam,
  leaveTeam,
  transferCaptain,
} from "@/lib/services/teams.js";
import { User } from "@/models/User.js";
import { startTestMongo } from "../helpers/mongoTestEnv.js";

let mongo;

beforeAll(async () => {
  mongo = await startTestMongo();
}, 30000);

afterAll(async () => {
  await mongo?.stop();
});

beforeEach(async () => {
  await mongo.clear();
});

describe("Teams, Problem Progress, and Contests services", () => {
  it("enforces 5-member team cap, captain transfer before leaving, and team disband", async () => {
    const now = new Date("2026-10-28T15:00:00Z");
    const students = [];
    for (let i = 0; i < 6; i += 1) {
      students.push(
        await User.create({
          name: `Student ${i}`,
          email: `s${i}@ncc.edu`,
          passwordHash: await hashPassword("studentpass123"),
          role: "student",
          status: "active",
          handles: { codeforces: `cf_${i}` },
        }),
      );
    }

    const ctxFor = (u) => ({ actor: { id: String(u._id), role: "student" }, now });

    const team = await createTeam(ctxFor(students[0]), { name: "Addis Knights" });
    expect(team.memberCount).toBe(1);

    for (let i = 1; i <= 4; i += 1) {
      await joinTeam(ctxFor(students[i]), { inviteCode: team.inviteCode });
    }

    // 6th student cannot join full team (cap = 5)
    await expect(
      joinTeam(ctxFor(students[5]), { inviteCode: team.inviteCode }),
    ).rejects.toMatchObject({ code: "INVALID_STATE", status: 409 });

    // Captain cannot leave without transferring captaincy when other members remain
    await expect(leaveTeam(ctxFor(students[0]))).rejects.toMatchObject({
      code: "INVALID_STATE",
      status: 409,
    });

    // Transfer captaincy and then former captain can leave
    const transferred = await transferCaptain(ctxFor(students[0]), String(students[1]._id));
    expect(transferred.captainId).toBe(String(students[1]._id));
    await expect(leaveTeam(ctxFor(students[0]))).resolves.toEqual({ ok: true });

    // New captain disbands team
    const disbanded = await disbandTeam(ctxFor(students[1]));
    expect(disbanded.id).toBe(team.id);
  });

  it("verifies Codeforces solves, blocks LeetCode, and protects topic deletion while problems exist", async () => {
    const now = new Date("2026-10-28T16:00:00Z");
    const admin = await User.create({
      name: "Admin",
      email: "admin@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });
    const student = await User.create({
      name: "Solver",
      email: "solver@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
      handles: { codeforces: "solver_cf" },
    });

    const adminCtx = { actor: { id: String(admin._id), role: "admin" }, now, correlationId: "c-topic" };
    const studentCtx = { actor: { id: String(student._id), role: "student" }, now };

    const topic = await createTopic(adminCtx, { name: "Graphs", slug: "graphs", order: 1 });
    const cfProb = await createProblem(adminCtx, {
      title: "Road Construction",
      topicId: topic.id,
      platform: "codeforces",
      url: "https://codeforces.com/problemset/problem/1000/B",
      value: 1400,
      externalRef: { contestId: "1000", index: "B" },
    });
    await publishProblem(adminCtx, cfProb.id);

    const lcProb = await createProblem(adminCtx, {
      title: "Two Sum",
      topicId: topic.id,
      platform: "leetcode",
      url: "https://leetcode.com/problems/two-sum/",
      value: 800,
      externalRef: { slug: "two-sum" },
    });
    await publishProblem(adminCtx, lcProb.id);

    // Topic deletion blocked while problems exist
    await expect(deleteTopic(adminCtx, topic.id)).rejects.toMatchObject({
      code: "INVALID_STATE",
      status: 409,
    });

    // LeetCode check returns unavailable cleanly
    const lcCheck = await checkSolve(studentCtx, lcProb.id);
    expect(lcCheck.result).toBe("unavailable");

    // Eligibility helper checks OK verdict and contestId+index
    expect(
      isSolveEligible({
        problem: { platform: "codeforces", externalRef: { contestId: "1000", index: "B" } },
        submission: { verdict: "OK", contestId: 1000, index: "B" },
      }),
    ).toBe(true);
    expect(
      isSolveEligible({
        problem: { platform: "codeforces", externalRef: { contestId: "1000", index: "B" } },
        submission: { verdict: "WRONG_ANSWER", contestId: 1000, index: "B" },
      }),
    ).toBe(false);

    // Solve check with mocked CF submission verifies solved status
    const solvedRes = await checkSolve(studentCtx, cfProb.id, {
      fetchUserSubmissionsImpl: async () => [
        { verdict: "OK", contestId: 1000, index: "B", creationTimeSeconds: 1761667200 },
      ],
    });
    expect(solvedRes.result).toBe("solved");
    expect(solvedRes.problem.status).toBe("solved");

    // Deleting problems allows topic deletion
    await deleteProblem(adminCtx, cfProb.id);
    await deleteProblem(adminCtx, lcProb.id);
    await expect(deleteTopic(adminCtx, topic.id)).resolves.toEqual({ id: topic.id });
  });

  it("fetches Codeforces standings, aggregates team contest points, publishes, and refuses overwrites", async () => {
    const now = new Date("2026-10-28T17:00:00Z");
    const admin = await User.create({
      name: "Admin",
      email: "admin@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });
    const s1 = await User.create({
      name: "Alpha",
      email: "a@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
      handles: { codeforces: "alpha_cf" },
    });
    const s2 = await User.create({
      name: "Beta",
      email: "b@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
      handles: { codeforces: "beta_cf" },
    });

    const team = await createTeam({ actor: { id: String(s1._id), role: "student" }, now }, { name: "Sheba" });
    await joinTeam({ actor: { id: String(s2._id), role: "student" }, now }, { inviteCode: team.inviteCode });

    const adminCtx = { actor: { id: String(admin._id), role: "admin" }, now, correlationId: "c-contest" };
    const contest = await createContest(adminCtx, {
      title: "Team Cup #1",
      description: "Weekly team mashup",
      mode: "team",
      platformContestId: "99999",
      url: "https://codeforces.com/contest/99999",
      startsAt: "2026-10-21T10:00:00Z",
      durationMinutes: 10080,
    });
    await publishContest(adminCtx, contest.id);

    const fetched = await fetchResults(adminCtx, contest.id, {
      fetchContestStandingsImpl: async () => [
        { handle: "ALPHA_CF", rank: 1, points: 400, penalty: 25 },
        { handle: "beta_cf", rank: 2, points: 300, penalty: 30 },
        { handle: "outsider_cf", rank: 3, points: 200, penalty: 10 },
      ],
    });
    expect(fetched.matched).toBe(2);
    expect(fetched.unmatchedHandles).toEqual(["outsider_cf"]);
    expect(fetched.teamsMatched).toBe(1);

    await publishResults(adminCtx, contest.id);

    // Re-fetching after publication is refused
    await expect(
      fetchResults(adminCtx, contest.id, { fetchContestStandingsImpl: async () => [] }),
    ).rejects.toMatchObject({ code: "INVALID_STATE", status: 409 });

    const studentStandings = await listResults(
      { actor: { id: String(s1._id), role: "student" }, now },
      contest.id,
      {},
    );
    expect(studentStandings.teams).toHaveLength(1);
    expect(studentStandings.teams[0].points).toBe(700);
    expect(studentStandings.teams[0].penalty).toBe(55);
    expect(studentStandings.teams[0].isMine).toBe(true);
    expect(studentStandings.members).toHaveLength(2);
  });
});
