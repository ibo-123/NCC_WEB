import { createHash } from "node:crypto";
import { z } from "zod";

// Environment parsing and readiness checks (MASTER_ARCHITECTURE.md §8.1, §8.2).
//
// Rules this module enforces:
// - Nothing runs at import. Validation happens when getEnv / assertConfigReady is called.
// - Error messages and logs name variables, never values.
// - Secrets and keys have no default. Policy defaults apply only when a variable is absent
//   (undefined); a present-but-invalid value (including an empty string) is a failure for
//   its scope. The one exception is REGISTRATION_MODE, which fails closed to "closed".
// - No other module reads process.env.

export const CONFIG_SCOPES = Object.freeze([
  "core",
  "attendance",
  "admin2fa",
  "registration",
  "restrictedContact",
  "rating",
  "streak",
  "codeforces",
]);

export class ConfigError extends Error {
  constructor(scope, variables) {
    super(`Configuration for scope "${scope}" is missing or invalid: ${variables.join(", ")}`);
    this.name = "ConfigError";
    this.scope = scope;
    this.variables = Object.freeze([...variables]);
  }
}

// Text that marks a value as copied from an example file rather than set by an operator.
const PLACEHOLDER = /replace[-_ ]?with|replace[-_ ]?me|change[-_ ]?me|your[-_ ]|<[^>]*>|\bexample\.(com|org|net|invalid)\b|^x{4,}$/i;
export const isPlaceholder = (value) => typeof value === "string" && PLACEHOLDER.test(value.trim());

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Decodes a canonical base64 string that must be exactly 32 bytes; returns a Buffer or null. */
export function decodeKey32(value) {
  if (typeof value !== "string" || value.length !== 44 || !BASE64.test(value)) return null;
  const bytes = Buffer.from(value, "base64");
  if (bytes.length !== 32 || bytes.toString("base64") !== value) return null;
  return bytes;
}

const keyId = (bytes) => createHash("sha256").update(bytes).digest("hex").slice(0, 8);

// ---- field schemas (each fails with a generic message that carries no input) ----

const notPlaceholder = (s) => !isPlaceholder(s);

const requiredString = z.string().min(1).refine(notPlaceholder);

const mongoUri = requiredString.refine((s) => /^mongodb(\+srv)?:\/\/\S+$/.test(s));

const appUrl = requiredString.transform((s, ctx) => {
  try {
    const url = new URL(s);
    const plain =
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === "/" || url.pathname === "");
    if (plain) return url.origin;
  } catch {
    // fall through to the issue below
  }
  ctx.addIssue({ code: "custom", message: "invalid" });
  return z.NEVER;
});

const sessionSecret = requiredString.refine((s) => s.length >= 43, "invalid");

const key32 = z
  .string()
  .refine(notPlaceholder)
  .transform((s, ctx) => {
    const bytes = decodeKey32(s);
    if (!bytes) {
      ctx.addIssue({ code: "custom", message: "invalid" });
      return z.NEVER;
    }
    return { raw: s, bytes, keyId: keyId(bytes) };
  });

const positiveInt = (max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^\d{1,16}$/)
    .transform(Number)
    .refine((n) => Number.isSafeInteger(n) && n >= 1 && n <= max);

const isValidTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const timeZone = z.string().min(1).refine(isValidTimeZone);

const email = z
  .string()
  .max(254)
  .refine(notPlaceholder)
  .refine((s) => /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/.test(s));

const boolString = z.enum(["true", "false"]).transform((s) => s === "true");

const nonNegativeNumber = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/)
  .transform(Number)
  .refine((n) => Number.isFinite(n));

// ---- evaluation ----

function parseField(source, name, schema, { fallback, required = false } = {}) {
  const raw = source[name];
  if (raw === undefined) {
    return required ? { name, ok: false } : { name, ok: true, value: fallback };
  }
  const result = schema.safeParse(raw);
  return result.success ? { name, ok: true, value: result.data } : { name, ok: false };
}

function scopeOf(fields, build) {
  const invalid = fields.filter((f) => !f.ok).map((f) => f.name);
  if (invalid.length) return { ok: false, invalid, values: null };
  return { ok: true, invalid: [], values: build(Object.fromEntries(fields.map((f) => [f.name, f.value]))) };
}

/**
 * Pure evaluation of a variable source. Returns every scope's result; never throws and
 * never includes a value in anything but `values` of a valid scope.
 */
export function evaluateEnv(source = process.env) {
  const warnings = [];
  const isProduction = source.NODE_ENV === "production";

  // Core: required variables plus the unlisted variables that affect authentication or
  // data integrity (CAMPUS_TIMEZONE, BCRYPT_COST), which §8.2 treats as Core.
  const core = scopeOf(
    [
      parseField(source, "NODE_ENV", z.enum(["development", "production", "test"]), { required: true }),
      parseField(source, "MONGODB_URI", mongoUri, { required: true }),
      parseField(source, "SESSION_SECRET", sessionSecret, { required: true }),
      parseField(source, "APP_URL", appUrl, { required: true }),
      parseField(source, "CAMPUS_TIMEZONE", timeZone, { fallback: "Africa/Addis_Ababa" }),
      parseField(
        source,
        "BCRYPT_COST",
        z
          .string()
          .regex(/^\d{1,2}$/)
          .transform(Number)
          .refine((n) => n >= 4 && n <= 31),
        { fallback: 12 },
      ),
    ],
    (v) => ({
      nodeEnv: v.NODE_ENV,
      mongodbUri: v.MONGODB_URI,
      sessionSecret: v.SESSION_SECRET,
      appUrl: v.APP_URL,
      campusTimezone: v.CAMPUS_TIMEZONE,
      bcryptCost: v.BCRYPT_COST,
    }),
  );

  const sessionSecretValue = source.SESSION_SECRET;

  // Attendance.
  const attendanceFields = [
    parseField(source, "ATTENDANCE_CODE_ENCRYPTION_KEY", key32, { required: true }),
    parseField(source, "ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS", key32),
    parseField(source, "ATTENDANCE_DEFAULT_VALID_SECONDS", positiveInt(), { fallback: 600 }),
    parseField(source, "ATTENDANCE_MAX_ATTEMPTS", positiveInt(), { fallback: 5 }),
    parseField(source, "ATTENDANCE_LOCKOUT_SECONDS", positiveInt(), { fallback: 900 }),
  ];
  const attCurrent = attendanceFields[0];
  const attPrevious = attendanceFields[1];
  if (attCurrent.ok && attPrevious.ok && attPrevious.value) {
    const same = attPrevious.value.raw === attCurrent.value.raw || attPrevious.value.keyId === attCurrent.value.keyId;
    if (same) attPrevious.ok = false;
  }
  if (attCurrent.ok && sessionSecretValue !== undefined && attCurrent.value.raw === sessionSecretValue) {
    attCurrent.ok = false;
  }

  // Admin 2FA. The key is required only when ADMIN_2FA_ENABLED is true. An invalid
  // ADMIN_2FA_ENABLED fails closed: the scope is refused and the flag reads as enabled,
  // so invalid configuration can never switch 2FA off.
  const flag = parseField(source, "ADMIN_2FA_ENABLED", boolString, { fallback: false });
  const twofaEnabled = flag.ok ? flag.value : true;
  const twofaFields = [flag];
  if (twofaEnabled) {
    const key = parseField(source, "TWOFA_ENCRYPTION_KEY", key32, { required: true });
    if (key.ok && sessionSecretValue !== undefined && key.value.raw === sessionSecretValue) key.ok = false;
    twofaFields.push(key);
  }

  // Keys must differ from each other (the pair check marks both scopes; we cannot tell
  // which one an operator meant to change).
  const twofaKey = twofaFields.find((f) => f.name === "TWOFA_ENCRYPTION_KEY");
  if (twofaKey?.ok && attCurrent.ok && twofaKey.value.raw === attCurrent.value.raw) {
    twofaKey.ok = false;
    attCurrent.ok = false;
  }

  const attendance = scopeOf(attendanceFields, (v) => ({
    currentKey: v.ATTENDANCE_CODE_ENCRYPTION_KEY,
    previousKey: v.ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS ?? null,
    defaultValidSeconds: v.ATTENDANCE_DEFAULT_VALID_SECONDS,
    maxAttempts: v.ATTENDANCE_MAX_ATTEMPTS,
    lockoutSeconds: v.ATTENDANCE_LOCKOUT_SECONDS,
  }));

  const admin2fa = scopeOf(twofaFields, (v) => ({
    enabled: v.ADMIN_2FA_ENABLED,
    key: v.TWOFA_ENCRYPTION_KEY ?? null,
  }));

  // Registration: fail closed. Only the exact value "open" opens it.
  const regRaw = source.REGISTRATION_MODE;
  if (regRaw !== undefined && regRaw !== "open" && regRaw !== "closed") warnings.push({ scope: "registration", variables: ["REGISTRATION_MODE"] });
  const registration = { ok: true, invalid: [], values: { mode: regRaw === "open" ? "open" : "closed" } };

  // Restricted contact: required in production, optional elsewhere; a present value must be valid.
  const contact = parseField(source, "RESTRICTED_CONTACT_EMAIL", email, { required: isProduction });
  const restrictedContact = scopeOf([contact], (v) => ({ email: v.RESTRICTED_CONTACT_EMAIL ?? null }));

  // Seam variables: unset means the feature is off. An invalid value disables only that feature.
  const rating = scopeOf(
    [
      parseField(source, "RATING_WARNING_THRESHOLD", nonNegativeNumber),
      parseField(source, "RESTRICTION_RATING_THRESHOLD", nonNegativeNumber),
    ],
    (v) => ({
      warningThreshold: v.RATING_WARNING_THRESHOLD ?? null,
      restrictionThreshold: v.RESTRICTION_RATING_THRESHOLD ?? null,
    }),
  );

  // The accepted format of STREAK_QUALIFYING_TYPES is decision B5 (open): only the raw tokens are exposed.
  const streak = scopeOf(
    [
      parseField(
        source,
        "STREAK_QUALIFYING_TYPES",
        z
          .string()
          .transform((s) => s.split(",").map((t) => t.trim()))
          .refine((tokens) => tokens.length > 0 && tokens.every(Boolean)),
      ),
    ],
    (v) => ({ qualifyingTypes: v.STREAK_QUALIFYING_TYPES ?? null }),
  );

  const optionalSecret = z.string().min(1).refine(notPlaceholder);
  const codeforces = scopeOf(
    [parseField(source, "CODEFORCES_API_KEY", optionalSecret), parseField(source, "CODEFORCES_API_SECRET", optionalSecret)],
    (v) => ({ apiKey: v.CODEFORCES_API_KEY ?? null, apiSecret: v.CODEFORCES_API_SECRET ?? null }),
  );

  return {
    scopes: { core, attendance, admin2fa, registration, restrictedContact, rating, streak, codeforces },
    warnings,
  };
}

// ---- process-level cache (computed once per process, logged by variable name only) ----

let cache = null;

function logOnce(result) {
  for (const [scope, r] of Object.entries(result.scopes)) {
    if (!r.ok) console.error(JSON.stringify({ level: "error", event: "config.invalid", scope, variables: r.invalid }));
  }
  for (const w of result.warnings) {
    console.warn(JSON.stringify({ level: "warn", event: "config.invalid-defaulted", scope: w.scope, variables: w.variables }));
  }
}

function current() {
  if (!cache) {
    cache = evaluateEnv(process.env);
    logOnce(cache);
  }
  return cache;
}

/** Clears the cached evaluation. Tests only. */
export function resetConfigCache() {
  cache = null;
}

/**
 * Typed values for every scope. Never throws. A scope that failed validation reads as `null`
 * here; use assertConfigReady(scope) before relying on it.
 */
export function getEnv() {
  const { scopes } = current();
  return Object.freeze({
    core: scopes.core.values,
    attendance: scopes.attendance.values,
    admin2fa: scopes.admin2fa.values,
    registration: scopes.registration.values,
    restrictedContact: scopes.restrictedContact.values,
    rating: scopes.rating.values,
    streak: scopes.streak.values,
    codeforces: scopes.codeforces.values,
  });
}

/** Returns the scope's values, or throws ConfigError naming the invalid variables (never values). */
export function assertConfigReady(scope) {
  if (!CONFIG_SCOPES.includes(scope)) throw new TypeError(`Unknown configuration scope "${String(scope)}"`);
  const result = current().scopes[scope];
  if (!result.ok) throw new ConfigError(scope, result.invalid);
  return result.values;
}

/**
 * Validates only CAMPUS_TIMEZONE. Used by time helpers that must not need database or
 * secret configuration. Throws ConfigError (scope "core") when the value is invalid.
 */
export function getCampusTimezone(source = process.env) {
  const field = parseField(source, "CAMPUS_TIMEZONE", timeZone, { fallback: "Africa/Addis_Ababa" });
  if (!field.ok) throw new ConfigError("core", ["CAMPUS_TIMEZONE"]);
  return field.value;
}

/** True when NODE_ENV is "production". Reads NODE_ENV only; needs no other configuration. */
export function isProduction(source = process.env) {
  return source.NODE_ENV === "production";
}
