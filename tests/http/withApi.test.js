import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConfigError } from "@/lib/config/env.js";
import { AppError } from "@/lib/http/errors.js";
import { configureWithApi, createWithApi } from "@/lib/http/withApi.js";
import { allowCsrf, denyingAccess, fakeAccess, jsonRequest, readyConfig, rejectCsrf } from "../helpers/withApiDoubles.js";

const URL_ = "http://localhost:3000/api/things";
const call = (route, request, params = {}) => route(request, { params: Promise.resolve(params) });
const bodyOf = (res) => res.json();

function make(deps = {}) {
  return createWithApi({
    assertConfigReady: readyConfig,
    checkMutatingRequest: allowCsrf,
    resolveAccess: fakeAccess(),
    ...deps,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  configureWithApi({});
});

describe("declaration", () => {
  it("requires exactly one of permission or public", () => {
    const withApi = make();
    const h = () => {};
    expect(() => withApi({}, h)).toThrow(TypeError);
    expect(() => withApi(undefined, h)).toThrow(TypeError);
    expect(() => withApi({ permission: "a.b", public: { reason: "x" } }, h)).toThrow(TypeError);
    expect(() => withApi({ public: {} }, h)).toThrow(TypeError);
    expect(() => withApi({ public: { reason: "  " } }, h)).toThrow(TypeError);
    expect(() => withApi({ permission: "not a permission" }, h)).toThrow(TypeError);
    expect(() => withApi({ permission: "a.b" }, "nope")).toThrow(TypeError);
    expect(() => withApi({ permission: "problems.read" }, h)).not.toThrow();
    expect(() => withApi({ public: { reason: "login" } }, h)).not.toThrow();
  });
});

describe("success path", () => {
  it("passes the documented context and wraps data in the envelope", async () => {
    const access = fakeAccess({ user: { id: "u42", role: "admin" }, session: { id: "s9" } });
    const now = new Date("2026-10-28T00:00:00Z");
    let ctx;
    const route = make({ resolveAccess: access, now: () => now })({ permission: "problems.read" }, (c) => {
      ctx = c;
      return { hello: "world" };
    });
    const res = await call(route, jsonRequest(URL_), { id: "1" });
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toEqual({ success: true, data: { hello: "world" } });
    expect(access.calls[0]).toEqual({ permission: "problems.read" });
    expect(ctx.actor).toEqual({ id: "u42", role: "admin" });
    expect(ctx.user.role).toBe("admin");
    expect(ctx.session.id).toBe("s9");
    expect(ctx.now).toBe(now);
    expect(ctx.params).toEqual({ id: "1" });
    expect(ctx.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers.get("x-correlation-id")).toBe(ctx.correlationId);
  });

  it("gives every request a fresh correlation id", async () => {
    const route = make()({ permission: "a.b" }, ({ correlationId }) => correlationId);
    const a = await (await call(route, jsonRequest(URL_))).json();
    const b = await (await call(route, jsonRequest(URL_))).json();
    expect(a.data).not.toBe(b.data);
  });

  it("returns null data when the handler returns nothing, and passes a Response through", async () => {
    const empty = make()({ permission: "a.b" }, () => undefined);
    expect((await (await call(empty, jsonRequest(URL_))).json()).data).toBeNull();
    const raw = make()({ permission: "a.b" }, () => new Response("x", { status: 201 }));
    const res = await call(raw, jsonRequest(URL_));
    expect(res.status).toBe(201);
    expect(res.headers.get("x-correlation-id")).toBeTruthy();
  });
});

describe("public and permission declarations", () => {
  it("public routes load no session or user", async () => {
    const access = fakeAccess();
    let ctx;
    const route = make({ resolveAccess: access })({ public: { reason: "login" } }, (c) => {
      ctx = c;
      return "ok";
    });
    expect((await call(route, jsonRequest(URL_, { method: "POST", body: {} }))).status).toBe(200);
    expect(access.calls).toHaveLength(0);
    expect(ctx.actor).toBeNull();
    expect(ctx.user).toBeNull();
    expect(ctx.session).toBeNull();
  });

  it.each([
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
    ["ACCOUNT_RESTRICTED", 403],
  ])("a failed access check (%s) maps to the envelope and never calls the handler", async (code, status) => {
    const handler = vi.fn();
    const access = denyingAccess(code);
    const route = make({ resolveAccess: access })({ permission: "a.b", schemas: { body: z.object({}) } }, handler);
    const res = await call(route, jsonRequest(URL_, { method: "POST", body: {} }));
    expect(res.status).toBe(status);
    expect((await bodyOf(res)).error.code).toBe(code);
    expect(handler).not.toHaveBeenCalled();
  });

  it("treats a missing user from the resolver as UNAUTHENTICATED", async () => {
    const handler = vi.fn();
    const route = make({ resolveAccess: async () => ({ user: null, session: null }) })({ permission: "a.b" }, handler);
    expect((await call(route, jsonRequest(URL_))).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not validate input before access (no leak to unauthenticated callers)", async () => {
    const route = make({ resolveAccess: denyingAccess("UNAUTHENTICATED") })(
      { permission: "a.b", schemas: { query: z.object({ q: z.string().min(5) }) } },
      vi.fn(),
    );
    const res = await call(route, jsonRequest(`${URL_}?q=x`));
    expect((await bodyOf(res)).error.code).toBe("UNAUTHENTICATED");
  });

  it("fails closed when no access resolver is registered", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    const route = createWithApi({ assertConfigReady: readyConfig })({ permission: "a.b" }, handler);
    const res = await call(route, jsonRequest(URL_));
    expect(res.status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  const schemas = {
    params: z.object({ id: z.string().regex(/^\d+$/, "id must be numeric") }),
    query: z.object({ page: z.string().optional() }),
    body: z.object({ title: z.string().min(3, "Title too short"), count: z.number().int() }),
  };

  it("passes parsed input and strips unknown keys", async () => {
    let input;
    const route = make()({ permission: "a.b", schemas }, (c) => {
      input = c.input;
      return null;
    });
    const res = await call(
      route,
      jsonRequest(`${URL_}?page=2&evil=1`, { method: "POST", body: { title: "Hello", count: 3, role: "admin" } }),
      { id: "7" },
    );
    expect(res.status).toBe(200);
    expect(input).toEqual({ params: { id: "7" }, query: { page: "2" }, body: { title: "Hello", count: 3 } });
  });

  it("returns 400 VALIDATION_ERROR with a flat fields map and does not call the handler", async () => {
    const handler = vi.fn();
    const route = make()({ permission: "a.b", schemas }, handler);
    const res = await call(route, jsonRequest(URL_, { method: "POST", body: { title: "x", count: "no" } }), { id: "abc" });
    expect(res.status).toBe(400);
    const { error } = await bodyOf(res);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fields).toMatchObject({ id: "id must be numeric", title: "Title too short" });
    expect(error.fields).toHaveProperty("count");
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and an empty body when a body schema exists", async () => {
    const route = make()({ permission: "a.b", schemas: { body: z.object({ a: z.string() }) } }, vi.fn());
    const bad = await call(route, jsonRequest(URL_, { method: "POST", body: "{not json" }));
    expect(bad.status).toBe(400);
    expect((await bodyOf(bad)).error.code).toBe("VALIDATION_ERROR");
    const empty = await call(route, jsonRequest(URL_, { method: "POST" }));
    expect(empty.status).toBe(400);
  });

  it("exposes repeated query keys as arrays", async () => {
    let input;
    const route = make()({ permission: "a.b", schemas: { query: z.object({ tag: z.array(z.string()) }) } }, (c) => {
      input = c.input;
    });
    await call(route, jsonRequest(`${URL_}?tag=a&tag=b`));
    expect(input.query.tag).toEqual(["a", "b"]);
  });
});

describe("error mapping", () => {
  it("maps a thrown AppError", async () => {
    const route = make()({ permission: "a.b" }, () => {
      throw new AppError("NOT_FOUND");
    });
    const res = await call(route, jsonRequest(URL_));
    expect(res.status).toBe(404);
    expect((await bodyOf(res)).error.code).toBe("NOT_FOUND");
  });

  it("maps unknown errors to INTERNAL_ERROR with no stack or message in the response", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const route = make()({ permission: "a.b" }, () => {
      throw new Error("connection string mongodb://user:pass@host failed");
    });
    const res = await call(route, jsonRequest(URL_));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await bodyOf(res));
    expect(text).toContain("INTERNAL_ERROR");
    expect(text).not.toContain("mongodb://");
    expect(text).not.toContain("at ");
    const logged = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).not.toContain("user:pass");
    expect(logged).toContain(res.headers.get("x-correlation-id"));
  });
});

describe("mutating-request check (LA-3 blocked responses)", () => {
  it.each([["POST"], ["PUT"], ["PATCH"], ["DELETE"]])("%s runs the check; a refusal blocks the handler", async (method) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    const access = fakeAccess();
    const route = make({ checkMutatingRequest: rejectCsrf("origin"), resolveAccess: access })({ permission: "a.b" }, handler);
    const res = await call(route, jsonRequest(URL_, { method, body: {} }));
    expect(res.status).toBe(500);
    expect((await bodyOf(res)).error.code).toBe("INTERNAL_ERROR");
    expect(handler).not.toHaveBeenCalled();
    expect(access.calls).toHaveLength(0);
  });

  it("GET never runs the check", async () => {
    const check = vi.fn(allowCsrf);
    const route = make({ checkMutatingRequest: check })({ permission: "a.b" }, () => 1);
    await call(route, jsonRequest(URL_));
    expect(check).not.toHaveBeenCalled();
  });

  it("logs LA-3-BLOCKED with the kind: csrf by default, non-json for content-type reasons", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    for (const [reason, kind] of [["origin", "csrf"], [undefined, "csrf"], ["content-type", "non-json"]]) {
      spy.mockClear();
      const route = make({ checkMutatingRequest: rejectCsrf(reason) })({ public: { reason: "x" } }, handler);
      await call(route, jsonRequest(URL_, { method: "POST", body: {} }));
      const line = JSON.parse(spy.mock.calls[0][0]);
      expect(line).toMatchObject({ event: "LA-3-BLOCKED", kind });
    }
  });

  it("fails closed when no checker is registered", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    const route = createWithApi({ assertConfigReady: readyConfig, resolveAccess: fakeAccess() })({ permission: "a.b" }, handler);
    expect((await call(route, jsonRequest(URL_, { method: "POST", body: {} }))).status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses dependencies registered through configureWithApi", async () => {
    configureWithApi({ assertConfigReady: readyConfig, checkMutatingRequest: allowCsrf, resolveAccess: fakeAccess() });
    const route = createWithApi()({ permission: "a.b" }, () => "registered");
    const res = await call(route, jsonRequest(URL_, { method: "POST", body: {} }));
    expect((await bodyOf(res)).data).toBe("registered");
  });
});

describe("configuration readiness", () => {
  it("a Core failure refuses every route, public included, with the interim 503 and no variable names", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ready = (scope) => {
      if (scope === "core") throw new ConfigError("core", ["MONGODB_URI"]);
    };
    for (const declaration of [{ permission: "a.b" }, { public: { reason: "login" } }]) {
      const handler = vi.fn();
      const route = make({ assertConfigReady: ready })(declaration, handler);
      const res = await call(route, jsonRequest(URL_));
      expect(res.status).toBe(503);
      const text = JSON.stringify(await bodyOf(res));
      expect(text).toContain("DEPENDENCY_UNAVAILABLE");
      expect(text).toContain("The service is temporarily unavailable.");
      expect(text).not.toContain("MONGODB_URI");
      expect(handler).not.toHaveBeenCalled();
    }
    expect(spy.mock.calls.map((c) => String(c[0])).join("\n")).toContain("MONGODB_URI");
  });

  it.each([
    ["attendance.start", "attendance"],
    ["attendance.close", "attendance"],
    ["twofa.enroll", "admin2fa"],
    ["auth.2fa.verify", "admin2fa"],
  ])("%s is refused only when scope %s is invalid", async (permission, scope) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ready = (s) => {
      if (s === scope) throw new ConfigError(scope, ["SOME_KEY"]);
    };
    const handler = vi.fn();
    const refused = await call(make({ assertConfigReady: ready })({ permission }, handler), jsonRequest(URL_));
    expect(refused.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
    const unrelated = await call(make({ assertConfigReady: ready })({ permission: "problems.read" }, () => 1), jsonRequest(URL_));
    expect(unrelated.status).toBe(200);
  });
});
