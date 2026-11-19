import { beforeEach, describe, expect, it } from "vitest";
import { checkMutatingRequest } from "@/lib/security/csrf.js";
import { applyTestEnv } from "../helpers/mongoTestEnv.js";

function makeReq(headers = {}) {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers,
    body: "{}",
  });
}

beforeEach(() => {
  applyTestEnv({ APP_URL: "http://localhost:3000" });
});

describe("CSRF & mutating request validation", () => {
  it("allows same-origin JSON requests", () => {
    const res = checkMutatingRequest(
      makeReq({
        origin: "http://localhost:3000",
        "content-type": "application/json; charset=utf-8",
      }),
    );
    expect(res).toEqual({ ok: true });
  });

  it("allows reverse-proxied same-origin requests when sec-fetch-site and forwarded host match", () => {
    const res = checkMutatingRequest(
      makeReq({
        origin: "https://preview.example.dev",
        "x-forwarded-host": "preview.example.dev",
        "sec-fetch-site": "same-origin",
        "content-type": "application/json",
      }),
    );
    expect(res).toEqual({ ok: true });
  });

  it("rejects missing or cross-site Origin headers", () => {
    expect(
      checkMutatingRequest(makeReq({ "content-type": "application/json" })),
    ).toEqual({ ok: false, reason: "origin" });

    expect(
      checkMutatingRequest(
        makeReq({
          origin: "https://evil.example.net",
          "content-type": "application/json",
        }),
      ),
    ).toEqual({ ok: false, reason: "origin" });
  });

  it("rejects non-JSON Content-Type on mutating requests", () => {
    expect(
      checkMutatingRequest(
        makeReq({
          origin: "http://localhost:3000",
          "content-type": "application/x-www-form-urlencoded",
        }),
      ),
    ).toEqual({ ok: false, reason: "non-json" });
  });
});
