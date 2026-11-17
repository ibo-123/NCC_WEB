import { describe, expect, it } from "vitest";
import { BLOCKED_KINDS, BlockedContractError, refuseBlocked } from "@/lib/http/blocked.js";
import { ERROR_CODES } from "@/lib/http/errors.js";

describe("refuseBlocked", () => {
  it.each(["registration-closed", "login-failure", "two-factor-invalid", "csrf", "non-json"])("%s throws BlockedContractError", (kind) => {
    let error;
    try {
      refuseBlocked(kind);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(BlockedContractError);
    expect(error.kind).toBe(kind);
  });

  it("rejects unknown kinds", () => {
    expect(() => refuseBlocked("other")).toThrow(TypeError);
    expect(() => refuseBlocked("toString")).toThrow(TypeError);
  });

  it("covers exactly the five BLOCKED contracts, all backed by PENDING codes", () => {
    expect(Object.keys(BLOCKED_KINDS)).toHaveLength(5);
    for (const { pendingCode, intendedStatus } of Object.values(BLOCKED_KINDS)) {
      expect(ERROR_CODES[pendingCode].approved).toBe(false);
      expect(ERROR_CODES[pendingCode].status).toBe(intendedStatus);
    }
  });
});
