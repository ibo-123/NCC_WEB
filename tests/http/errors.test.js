import { describe, expect, it } from "vitest";
import { between, readDoc, tableRows } from "../contracts/helpers/markdown.js";
import { AppError, configRefusal, ERROR_CODES } from "@/lib/http/errors.js";

const master = readDoc("docs/MASTER_ARCHITECTURE.md");
const docRegistry = tableRows(between(master, "### 6.4", "### 6.5"))
  .filter((cells) => /^`[A-Z_]+`$/.test(cells[0]))
  .map((cells) => ({
    code: cells[0].replace(/`/g, ""),
    http: Number(cells[1]),
    approved: cells[3].trim() === "APPROVED",
  }));

describe("ERROR_CODES", () => {
  it("has exactly the 22 codes of the registry", () => {
    expect(Object.keys(ERROR_CODES)).toHaveLength(22);
    expect(docRegistry).toHaveLength(22);
  });

  it("matches the documented registry: codes, HTTP status and APPROVED/PENDING", () => {
    for (const row of docRegistry) {
      expect(ERROR_CODES[row.code], row.code).toBeDefined();
      expect(ERROR_CODES[row.code].status, row.code).toBe(row.http);
      expect(ERROR_CODES[row.code].approved, row.code).toBe(row.approved);
    }
    expect(Object.keys(ERROR_CODES).sort()).toEqual(docRegistry.map((r) => r.code).sort());
  });

  it("has 15 approved and 7 pending codes, and never uses 422", () => {
    const entries = Object.values(ERROR_CODES);
    expect(entries.filter((e) => e.approved)).toHaveLength(15);
    expect(entries.filter((e) => !e.approved)).toHaveLength(7);
    expect(entries.some((e) => e.status === 422)).toBe(false);
  });
});

describe("AppError", () => {
  const approved = Object.entries(ERROR_CODES).filter(([, e]) => e.approved);
  const pending = Object.entries(ERROR_CODES).filter(([, e]) => !e.approved);

  it.each(approved)("%s constructs with its registry status", (code, entry) => {
    const error = new AppError(code);
    expect(error.code).toBe(code);
    expect(error.status).toBe(entry.status);
    expect(error.message.length).toBeGreaterThan(0);
    expect(error).toBeInstanceOf(Error);
  });

  it.each(pending)("%s is refused because it is PENDING", (code) => {
    expect(() => new AppError(code)).toThrow(/PENDING/);
  });

  it("refuses unknown codes, including inherited object keys", () => {
    expect(() => new AppError("NOPE")).toThrow(TypeError);
    expect(() => new AppError("toString")).toThrow(TypeError);
  });

  it("carries message, fields and retryAfterSeconds", () => {
    const error = new AppError("RATE_LIMITED", { message: "slow down", retryAfterSeconds: 30 });
    expect(error.message).toBe("slow down");
    expect(error.retryAfterSeconds).toBe(30);
    const v = new AppError("VALIDATION_ERROR", { fields: { email: "bad" } });
    expect(v.fields).toEqual({ email: "bad" });
  });

  it("rejects an invalid retryAfterSeconds", () => {
    for (const v of [0, -1, 1.5, "3"]) expect(() => new AppError("RATE_LIMITED", { retryAfterSeconds: v })).toThrow(TypeError);
  });
});

describe("configRefusal", () => {
  it("is the interim 503 DEPENDENCY_UNAVAILABLE with a generic message", () => {
    const error = configRefusal();
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("DEPENDENCY_UNAVAILABLE");
    expect(error.status).toBe(503);
    expect(error.message).toBe("The service is temporarily unavailable.");
    expect(error.fields).toBeUndefined();
  });
});
