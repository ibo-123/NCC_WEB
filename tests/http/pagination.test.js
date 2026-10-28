import { describe, expect, it } from "vitest";
import { paginated, parsePagination } from "@/lib/http/pagination.js";

const q = (s) => new URLSearchParams(s);

describe("parsePagination", () => {
  it("defaults to page 1, limit 20", () => {
    expect(parsePagination(q(""))).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("parses values and computes skip", () => {
    expect(parsePagination(q("page=3&limit=10"))).toEqual({ page: 3, limit: 10, skip: 20 });
    expect(parsePagination(q("limit=50"))).toMatchObject({ limit: 50 });
    expect(parsePagination(q("limit=1"))).toMatchObject({ limit: 1 });
  });

  it("accepts a plain object too", () => {
    expect(parsePagination({ page: "2", limit: "5" })).toEqual({ page: 2, limit: 5, skip: 5 });
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination(undefined)).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it.each([
    ["page=0", "page"],
    ["page=-1", "page"],
    ["page=abc", "page"],
    ["page=1.5", "page"],
    ["page=", "page"],
    ["page=99999999999", "page"],
    ["limit=0", "limit"],
    ["limit=51", "limit"],
    ["limit=-5", "limit"],
    ["limit=ten", "limit"],
    ["limit=", "limit"],
  ])("%s is a 400 VALIDATION_ERROR naming %s", (query, field) => {
    let error;
    try {
      parsePagination(q(query));
    } catch (e) {
      error = e;
    }
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
    expect(Object.keys(error.fields)).toEqual([field]);
  });

  it("reports both fields when both are invalid", () => {
    try {
      parsePagination(q("page=0&limit=99"));
      expect.unreachable();
    } catch (e) {
      expect(Object.keys(e.fields).sort()).toEqual(["limit", "page"]);
    }
  });
});

describe("paginated", () => {
  it("builds the list envelope data", () => {
    expect(paginated(["a", "b"], 45, { page: 1, limit: 20 })).toEqual({
      items: ["a", "b"],
      pagination: { page: 1, limit: 20, total: 45, totalPages: 3 },
    });
  });
  it("has zero pages for an empty list and exact division", () => {
    expect(paginated([], 0, { page: 1, limit: 20 }).pagination.totalPages).toBe(0);
    expect(paginated([], 40, { page: 1, limit: 20 }).pagination.totalPages).toBe(2);
  });
});
