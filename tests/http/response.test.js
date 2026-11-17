import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http/errors.js";
import { failure, ok } from "@/lib/http/response.js";

describe("ok", () => {
  it("wraps data in the success envelope", async () => {
    const res = ok({ a: 1 });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ success: true, data: { a: 1 } });
  });

  it("supports a status and extra headers", async () => {
    const res = ok({ id: "x" }, { status: 201, headers: { "x-test": "1" } });
    expect(res.status).toBe(201);
    expect(res.headers.get("x-test")).toBe("1");
  });
});

describe("failure", () => {
  it("renders an AppError with only the documented keys", async () => {
    const res = failure(new AppError("NOT_FOUND"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: { code: "NOT_FOUND", message: "The resource was not found." } });
  });

  it("includes fields for validation errors", async () => {
    const res = failure(new AppError("VALIDATION_ERROR", { fields: { name: "Required" } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.fields).toEqual({ name: "Required" });
  });

  it("includes retryAfterSeconds and a Retry-After header for rate limits", async () => {
    const res = failure(new AppError("RATE_LIMITED", { retryAfterSeconds: 42 }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect((await res.json()).error.retryAfterSeconds).toBe(42);
  });

  it("turns unknown errors into a generic INTERNAL_ERROR with no leak", async () => {
    const res = failure(new Error("db password is hunter2\n    at secret.js:1"));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("INTERNAL_ERROR");
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("secret.js");
    expect(text).not.toContain("stack");
  });

  it("handles non-Error throwables", async () => {
    expect(failure("oops").status).toBe(500);
    expect(failure(undefined).status).toBe(500);
  });
});
