import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  RATE_LIMIT_SCOPES,
  checkRateLimit,
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/security/rateLimit.js";
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

describe("MongoDB atomic rate limiter", () => {
  it("tracks counts, enforces lockout on LOGIN scope, and clears on resetRateLimit", async () => {
    const subject = "student@ncc.edu:127.0.0.1";
    const t0 = new Date("2026-10-28T10:00:00.000Z");

    const pre = await checkRateLimit(RATE_LIMIT_SCOPES.LOGIN, subject, { now: t0 });
    expect(pre.allowed).toBe(true);
    expect(pre.remaining).toBe(5);

    for (let i = 1; i <= 4; i += 1) {
      const step = await consumeRateLimit(RATE_LIMIT_SCOPES.LOGIN, subject, { now: t0 });
      expect(step.allowed).toBe(true);
      expect(step.count).toBe(i);
    }

    // 5th attempt hits max=5 and triggers lockoutSeconds=900
    const fifth = await consumeRateLimit(RATE_LIMIT_SCOPES.LOGIN, subject, { now: t0 });
    expect(fifth.lockedOutNow).toBe(true);
    expect(fifth.allowed).toBe(false);
    expect(fifth.retryAfterSeconds).toBe(900);

    const blockedCheck = await checkRateLimit(RATE_LIMIT_SCOPES.LOGIN, subject, {
      now: new Date(t0.getTime() + 60_000),
    });
    expect(blockedCheck.allowed).toBe(false);

    // After resetRateLimit, counter clears immediately
    await resetRateLimit(RATE_LIMIT_SCOPES.LOGIN, subject);
    const resetCheck = await checkRateLimit(RATE_LIMIT_SCOPES.LOGIN, subject, { now: t0 });
    expect(resetCheck.allowed).toBe(true);
    expect(resetCheck.count).toBe(0);
  });

  it("resets window automatically after windowSeconds elapse for REGISTER scope", async () => {
    const t0 = new Date("2026-10-28T10:00:00.000Z");
    for (let i = 0; i < 5; i += 1) {
      const ok = await consumeRateLimit(RATE_LIMIT_SCOPES.REGISTER, "10.0.0.2", { now: t0 });
      expect(ok.allowed).toBe(true);
    }
    const sixth = await consumeRateLimit(RATE_LIMIT_SCOPES.REGISTER, "10.0.0.2", { now: t0 });
    expect(sixth.allowed).toBe(false);

    const afterWindow = new Date(t0.getTime() + 3601 * 1000);
    const fresh = await consumeRateLimit(RATE_LIMIT_SCOPES.REGISTER, "10.0.0.2", { now: afterWindow });
    expect(fresh.allowed).toBe(true);
    expect(fresh.count).toBe(1);
  });
});
