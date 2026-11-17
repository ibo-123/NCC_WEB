import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertConfigReady,
  ConfigError,
  decodeKey32,
  evaluateEnv,
  getCampusTimezone,
  getEnv,
  resetConfigCache,
} from "@/lib/config/env.js";

const K = (n) => Buffer.alloc(32, n).toString("base64");
const SECRET = Buffer.alloc(32, 9).toString("base64");

const base = () => ({
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://localhost:27017/ncc?replicaSet=rs0",
  APP_URL: "http://localhost:3000",
  SESSION_SECRET: SECRET,
  ATTENDANCE_CODE_ENCRYPTION_KEY: K(1),
});
const scope = (env, name) => evaluateEnv(env).scopes[name];

describe("core scope", () => {
  it("accepts a valid environment and applies defaults only when absent", () => {
    const r = scope(base(), "core");
    expect(r.ok).toBe(true);
    expect(r.values).toMatchObject({
      nodeEnv: "test",
      appUrl: "http://localhost:3000",
      campusTimezone: "Africa/Addis_Ababa",
      bcryptCost: 12,
    });
  });

  it.each(["MONGODB_URI", "SESSION_SECRET", "APP_URL", "NODE_ENV"])("fails when %s is missing", (name) => {
    const env = base();
    delete env[name];
    const r = scope(env, "core");
    expect(r.ok).toBe(false);
    expect(r.invalid).toEqual([name]);
  });

  it.each([
    ["MONGODB_URI", "http://not-mongo"],
    ["MONGODB_URI", ""],
    ["APP_URL", "localhost:3000"],
    ["APP_URL", "http://localhost:3000/some/path"],
    ["APP_URL", "http://user:pw@localhost:3000"],
    ["SESSION_SECRET", "too-short"],
    ["NODE_ENV", "staging"],
    ["CAMPUS_TIMEZONE", "Mars/Olympus"],
    ["CAMPUS_TIMEZONE", ""],
    ["BCRYPT_COST", "3"],
    ["BCRYPT_COST", "abc"],
    ["BCRYPT_COST", ""],
  ])("rejects invalid %s=%j without replacing it by a default", (name, value) => {
    const r = scope({ ...base(), [name]: value }, "core");
    expect(r.ok).toBe(false);
    expect(r.invalid).toContain(name);
  });

  it("rejects example placeholder text", () => {
    for (const [name, value] of [
      ["SESSION_SECRET", "replace-with-a-long-random-secret-value-1234567890"],
      ["MONGODB_URI", "mongodb://<username>:<password>@host/db"],
    ]) {
      expect(scope({ ...base(), [name]: value }, "core").ok).toBe(false);
    }
  });

  it("normalizes APP_URL to its origin and accepts a trailing slash", () => {
    expect(scope({ ...base(), APP_URL: "https://ncc.example.edu/" }, "core").values.appUrl).toBe("https://ncc.example.edu");
  });

  it("accepts explicit overrides", () => {
    const r = scope({ ...base(), CAMPUS_TIMEZONE: "UTC", BCRYPT_COST: "10" }, "core");
    expect(r.values).toMatchObject({ campusTimezone: "UTC", bcryptCost: 10 });
  });
});

describe("attendance scope", () => {
  it("is valid with defaults", () => {
    const r = scope(base(), "attendance");
    expect(r.ok).toBe(true);
    expect(r.values).toMatchObject({ defaultValidSeconds: 600, maxAttempts: 5, lockoutSeconds: 900, previousKey: null });
    expect(r.values.currentKey.bytes).toHaveLength(32);
  });

  it("fails alone when the key is missing: core stays valid", () => {
    const env = base();
    delete env.ATTENDANCE_CODE_ENCRYPTION_KEY;
    const result = evaluateEnv(env);
    expect(result.scopes.attendance.invalid).toEqual(["ATTENDANCE_CODE_ENCRYPTION_KEY"]);
    expect(result.scopes.core.ok).toBe(true);
  });

  it.each([
    ["not base64", "%%%%"],
    ["wrong length", Buffer.alloc(16, 1).toString("base64")],
    ["empty", ""],
    ["placeholder", "replace-with-base64-32-byte-key"],
  ])("rejects a %s key", (_label, value) => {
    expect(scope({ ...base(), ATTENDANCE_CODE_ENCRYPTION_KEY: value }, "attendance").ok).toBe(false);
  });

  it("validates the previous key: absent ok, empty/whitespace/equal/malformed fail", () => {
    expect(scope({ ...base(), ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS: K(2) }, "attendance").ok).toBe(true);
    for (const v of ["", "   ", K(1), "nope", Buffer.alloc(8).toString("base64")]) {
      const r = scope({ ...base(), ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS: v }, "attendance");
      expect(r.ok, JSON.stringify(v)).toBe(false);
      expect(r.invalid).toContain("ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS");
    }
  });

  it.each(["ATTENDANCE_DEFAULT_VALID_SECONDS", "ATTENDANCE_MAX_ATTEMPTS", "ATTENDANCE_LOCKOUT_SECONDS"])(
    "%s: valid override, invalid values fail (no silent default)",
    (name) => {
      expect(scope({ ...base(), [name]: "30" }, "attendance").ok).toBe(true);
      for (const v of ["0", "-1", "1.5", "abc", ""]) {
        const r = scope({ ...base(), [name]: v }, "attendance");
        expect(r.ok, `${name}=${JSON.stringify(v)}`).toBe(false);
      }
    },
  );

  it("rejects an attendance key equal to SESSION_SECRET", () => {
    expect(scope({ ...base(), SESSION_SECRET: K(1) }, "attendance").ok).toBe(false);
  });
});

describe("admin 2FA scope", () => {
  it("needs no key while disabled (default)", () => {
    const r = scope(base(), "admin2fa");
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({ enabled: false, key: null });
  });

  it("requires a valid key when enabled", () => {
    const env = { ...base(), ADMIN_2FA_ENABLED: "true" };
    expect(scope(env, "admin2fa").invalid).toEqual(["TWOFA_ENCRYPTION_KEY"]);
    expect(scope({ ...env, TWOFA_ENCRYPTION_KEY: "bad" }, "admin2fa").ok).toBe(false);
    const good = scope({ ...env, TWOFA_ENCRYPTION_KEY: K(3) }, "admin2fa");
    expect(good.ok).toBe(true);
    expect(good.values.enabled).toBe(true);
  });

  it("does not validate a present key while disabled", () => {
    expect(scope({ ...base(), TWOFA_ENCRYPTION_KEY: "garbage" }, "admin2fa").ok).toBe(true);
  });

  it("fails closed when ADMIN_2FA_ENABLED is invalid", () => {
    const r = scope({ ...base(), ADMIN_2FA_ENABLED: "yes" }, "admin2fa");
    expect(r.ok).toBe(false);
    expect(r.invalid).toContain("ADMIN_2FA_ENABLED");
  });

  it("rejects equal SESSION_SECRET / TWOFA / ATTENDANCE keys", () => {
    const env = { ...base(), ADMIN_2FA_ENABLED: "true", TWOFA_ENCRYPTION_KEY: K(3) };
    expect(scope({ ...env, SESSION_SECRET: K(3) }, "admin2fa").ok).toBe(false);
    const same = { ...env, TWOFA_ENCRYPTION_KEY: K(1) };
    expect(scope(same, "admin2fa").ok).toBe(false);
    expect(scope(same, "attendance").ok).toBe(false);
    expect(scope(env, "admin2fa").ok).toBe(true);
  });
});

describe("registration scope", () => {
  it("is closed when absent, invalid, or closed; open only when exactly open", () => {
    expect(scope(base(), "registration").values.mode).toBe("closed");
    expect(scope({ ...base(), REGISTRATION_MODE: "closed" }, "registration").values.mode).toBe("closed");
    expect(scope({ ...base(), REGISTRATION_MODE: "OPEN" }, "registration").values.mode).toBe("closed");
    expect(scope({ ...base(), REGISTRATION_MODE: "" }, "registration").values.mode).toBe("closed");
    expect(scope({ ...base(), REGISTRATION_MODE: "open" }, "registration").values.mode).toBe("open");
  });

  it("logs an invalid value (variable name only) and never fails", () => {
    const result = evaluateEnv({ ...base(), REGISTRATION_MODE: "secret-looking-value" });
    expect(result.warnings).toEqual([{ scope: "registration", variables: ["REGISTRATION_MODE"] }]);
    expect(JSON.stringify(result.warnings)).not.toContain("secret-looking-value");
    expect(evaluateEnv(base()).warnings).toEqual([]);
  });
});

describe("restricted contact scope", () => {
  const prod = { ...base(), NODE_ENV: "production" };
  it("is required in production, optional elsewhere", () => {
    expect(scope(prod, "restrictedContact").invalid).toEqual(["RESTRICTED_CONTACT_EMAIL"]);
    expect(scope(base(), "restrictedContact").values).toEqual({ email: null });
  });
  it("accepts one plain address and rejects everything else", () => {
    expect(scope({ ...prod, RESTRICTED_CONTACT_EMAIL: "support@ncc.edu" }, "restrictedContact").values.email).toBe("support@ncc.edu");
    for (const v of ["", "Name <a@b.co>", "a@b.co, c@d.co", "not-an-email", "replace-with-contact@example.com", `${"a".repeat(250)}@b.co`]) {
      expect(scope({ ...prod, RESTRICTED_CONTACT_EMAIL: v }, "restrictedContact").ok, JSON.stringify(v)).toBe(false);
    }
  });
  it("does not affect core", () => {
    expect(evaluateEnv(prod).scopes.core.ok).toBe(true);
  });
});

describe("seam scopes (rating, streak, codeforces)", () => {
  it("are off when unset", () => {
    const { scopes } = evaluateEnv(base());
    expect(scopes.rating.values).toEqual({ warningThreshold: null, restrictionThreshold: null });
    expect(scopes.streak.values).toEqual({ qualifyingTypes: null });
    expect(scopes.codeforces.values).toEqual({ apiKey: null, apiSecret: null });
  });
  it("an invalid value disables only that feature", () => {
    const result = evaluateEnv({ ...base(), RATING_WARNING_THRESHOLD: "low", STREAK_QUALIFYING_TYPES: "a,,b" });
    expect(result.scopes.rating.ok).toBe(false);
    expect(result.scopes.streak.ok).toBe(false);
    expect(result.scopes.core.ok).toBe(true);
  });
  it("parses valid values", () => {
    const { scopes } = evaluateEnv({ ...base(), RATING_WARNING_THRESHOLD: "1200", STREAK_QUALIFYING_TYPES: "problem, contest" });
    expect(scopes.rating.values.warningThreshold).toBe(1200);
    expect(scopes.streak.values.qualifyingTypes).toEqual(["problem", "contest"]);
  });
});

describe("secrets never appear in errors or logs", () => {
  beforeEach(() => resetConfigCache());

  it("ConfigError and logs carry names, not values", () => {
    const secret = "SUPER-SECRET-VALUE-do-not-leak-0123456789abcdef";
    const env = { ...base(), SESSION_SECRET: "short", MONGODB_URI: `http://${secret}`, ATTENDANCE_CODE_ENCRYPTION_KEY: secret };
    vi.stubEnv("NODE_ENV", "test");
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    const logs = [];
    const spy = vi.spyOn(console, "error").mockImplementation((line) => logs.push(String(line)));
    try {
      for (const name of ["core", "attendance"]) {
        let caught;
        try {
          assertConfigReady(name);
        } catch (e) {
          caught = e;
        }
        expect(caught).toBeInstanceOf(ConfigError);
        expect(caught.message).not.toContain(secret);
        expect(caught.message).not.toContain("short");
        expect(JSON.stringify(caught.variables)).not.toContain(secret);
      }
      expect(logs.join("\n")).toContain("MONGODB_URI");
      expect(logs.join("\n")).not.toContain(secret);
    } finally {
      spy.mockRestore();
      vi.unstubAllEnvs();
      resetConfigCache();
    }
  });
});

describe("getEnv / assertConfigReady / import behavior", () => {
  beforeEach(() => resetConfigCache());

  it("importing the module reads nothing and validates nothing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
    await import("@/lib/config/env.js");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("getEnv never throws and reports a failed scope as null", () => {
    vi.stubEnv("MONGODB_URI", "");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(getEnv().core).toBeNull();
      expect(() => assertConfigReady("core")).toThrow(ConfigError);
    } finally {
      spy.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("rejects an unknown scope", () => {
    expect(() => assertConfigReady("nope")).toThrow(TypeError);
  });

  it("getCampusTimezone validates only the timezone", () => {
    expect(getCampusTimezone({})).toBe("Africa/Addis_Ababa");
    expect(getCampusTimezone({ CAMPUS_TIMEZONE: "UTC" })).toBe("UTC");
    expect(() => getCampusTimezone({ CAMPUS_TIMEZONE: "Nope/Zone" })).toThrow(ConfigError);
  });
});

describe("decodeKey32", () => {
  it("accepts only canonical 32-byte base64", () => {
    expect(decodeKey32(K(1))).toHaveLength(32);
    expect(decodeKey32(K(1).slice(0, -2))).toBeNull();
    expect(decodeKey32(`${K(1)}\n`)).toBeNull();
    expect(decodeKey32(undefined)).toBeNull();
  });
});

describe(".env.example", () => {
  const text = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
  const documented = new Set([...text.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]));
  const expected = [
    "MONGODB_URI", "APP_URL", "SESSION_SECRET", "CAMPUS_TIMEZONE", "REGISTRATION_MODE", "ADMIN_2FA_ENABLED",
    "TWOFA_ENCRYPTION_KEY", "ATTENDANCE_CODE_ENCRYPTION_KEY", "ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS",
    "ATTENDANCE_DEFAULT_VALID_SECONDS", "ATTENDANCE_MAX_ATTEMPTS", "ATTENDANCE_LOCKOUT_SECONDS", "BCRYPT_COST",
    "RESTRICTED_CONTACT_EMAIL", "RATING_WARNING_THRESHOLD", "RESTRICTION_RATING_THRESHOLD", "STREAK_QUALIFYING_TYPES",
    "CODEFORCES_API_KEY", "CODEFORCES_API_SECRET", "SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD",
  ];

  it("lists every variable of MASTER_ARCHITECTURE §8.1 (NODE_ENV is set by Next)", () => {
    for (const name of expected) expect(documented.has(name), name).toBe(true);
  });

  it("holds no secret value, and secrets are left empty", () => {
    for (const name of ["SESSION_SECRET", "TWOFA_ENCRYPTION_KEY", "ATTENDANCE_CODE_ENCRYPTION_KEY", "MONGODB_URI"]) {
      expect(text).toMatch(new RegExp(`^${name}=$`, "m"));
    }
  });

  it("is rejected as a configuration when copied unchanged", () => {
    const env = Object.fromEntries(
      [...text.matchAll(/^([A-Z][A-Z0-9_]+)=(.*)$/gm)].map((m) => [m[1], m[2]]),
    );
    const result = evaluateEnv({ NODE_ENV: "production", ...env });
    expect(result.scopes.core.ok).toBe(false);
    expect(result.scopes.attendance.ok).toBe(false);
  });
});
