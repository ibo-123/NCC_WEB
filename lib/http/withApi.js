import { randomUUID } from "node:crypto";
import { assertConfigReady, ConfigError } from "@/lib/config/env.js";
import { zodFields } from "@/lib/validation/index.js";
import { AppError, configRefusal } from "./errors.js";
import { failure, ok } from "./response.js";
import { BlockedContractError, refuseBlocked } from "./blocked.js";

// Request lifecycle wrapper (MASTER_ARCHITECTURE.md §5).
//
//   withApi({ permission: "x.y", schemas? }, handler)
//   withApi({ public: { reason }, schemas? }, handler)
//
// Order: correlation id -> configuration readiness -> mutating-request check -> access
// (session + permission, from A4) -> Zod validation (unknown keys stripped) -> handler -> envelope.
// A handler is never called after a failed check.

const PERMISSION = /^[a-z]+(?:\.[a-zA-Z0-9]+)+$/;
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Permissions whose routes depend on a feature scope of §8.2 in addition to Core.
function featureScopeFor(permission) {
  if (permission.startsWith("attendance.")) return "attendance";
  if (permission === "twofa.enroll" || permission === "auth.2fa.verify") return "admin2fa";
  return null;
}

// Reasons A4's checkMutatingRequest may give for a refused request; anything else is a CSRF refusal.
const NON_JSON_REASONS = new Set(["non-json", "content-type", "unsupported-media-type"]);

function log(level, event, details) {
  const line = JSON.stringify({ level, event, ...details });
  (level === "error" ? console.error : console.warn)(line);
}

function assertDeclaration(declaration) {
  const hasPermission = declaration && typeof declaration.permission === "string";
  const hasPublic = declaration && declaration.public !== undefined;
  if (hasPermission === hasPublic) {
    throw new TypeError("withApi requires exactly one of `permission` or `public: { reason }`");
  }
  if (hasPermission && !PERMISSION.test(declaration.permission)) {
    throw new TypeError(`withApi permission "${declaration.permission}" is not a valid permission string`);
  }
  if (hasPublic && !(typeof declaration.public.reason === "string" && declaration.public.reason.trim())) {
    throw new TypeError("withApi public declarations require a non-empty `reason`");
  }
}

function queryObject(searchParams) {
  const out = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    out[key] = values.length === 1 ? values[0] : values;
  }
  return out;
}

async function readJsonBody(request) {
  const text = await request.text();
  if (text.trim() === "") return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("VALIDATION_ERROR", { fields: { _: "The request body must be valid JSON." } });
  }
}

function validate(schemas, raw) {
  const input = {};
  const fields = {};
  for (const part of ["params", "query", "body"]) {
    const schema = schemas?.[part];
    if (!schema) continue;
    const result = schema.safeParse(raw[part]);
    if (result.success) input[part] = result.data;
    else for (const [k, v] of Object.entries(zodFields(result.error))) if (!(k in fields)) fields[k] = v;
  }
  if (Object.keys(fields).length) throw new AppError("VALIDATION_ERROR", { fields });
  return input;
}

function toActor(user) {
  if (!user) return null;
  return { id: String(user.id ?? user._id), role: user.role };
}

/**
 * Builds a withApi with explicit dependencies. Tests use this with fakes; the application
 * registers A4's modules once through configureWithApi.
 *
 * deps:
 *   resolveAccess(request, declaration) -> { user, session } (A4)
 *   checkMutatingRequest(request) -> { ok, reason? } (A4)
 *   assertConfigReady(scope) (defaults to lib/config/env.js)
 *   now() -> Date
 */
export function createWithApi(deps = {}) {
  return function withApi(declaration, handler) {
    assertDeclaration(declaration);
    if (typeof handler !== "function") throw new TypeError("withApi requires a handler function");

    return async function route(request, routeContext) {
      const correlationId = randomUUID();
      const headers = { "x-correlation-id": correlationId };
      const d = { ...registered, ...deps };
      try {
        // 1. Configuration readiness. A Core failure refuses everything, public routes included.
        const ready = d.assertConfigReady ?? assertConfigReady;
        ready("core");
        const feature = declaration.permission ? featureScopeFor(declaration.permission) : null;
        if (feature) ready(feature);

        // 2. Origin/JSON check on mutating requests. Fails closed when no checker is registered.
        if (MUTATING.has(request.method)) {
          if (typeof d.checkMutatingRequest !== "function") {
            throw new Error("withApi: checkMutatingRequest is not registered");
          }
          const verdict = await d.checkMutatingRequest(request);
          if (!verdict?.ok) refuseBlocked(NON_JSON_REASONS.has(verdict?.reason) ? "non-json" : "csrf");
        }

        // 3. Access. Public routes load no session or user.
        let user = null;
        let session = null;
        if (!declaration.public) {
          if (typeof d.resolveAccess !== "function") throw new Error("withApi: resolveAccess is not registered");
          ({ user, session } = await d.resolveAccess(request, declaration));
          if (!user) throw new AppError("UNAUTHENTICATED");
        }

        // 4. Validation (unknown keys are stripped by non-strict Zod objects).
        const schemas = declaration.schemas;
        const raw = {};
        if (schemas?.params) raw.params = (await routeContext?.params) ?? {};
        if (schemas?.query) raw.query = queryObject(new URL(request.url).searchParams);
        if (schemas?.body) raw.body = await readJsonBody(request);
        const input = validate(schemas, raw);

        // 5. Handler.
        const now = d.now ? d.now() : new Date();
        const params = (await routeContext?.params) ?? {};
        const result = await handler({
          request,
          params,
          input,
          actor: toActor(user),
          user,
          session,
          correlationId,
          now,
        });
        if (result instanceof Response) {
          result.headers.set("x-correlation-id", correlationId);
          return result;
        }
        return ok(result ?? null, { headers });
      } catch (error) {
        if (error instanceof AppError) return failure(error, { headers });
        if (error instanceof ConfigError) {
          log("error", "config.refused", { correlationId, scope: error.scope, variables: error.variables });
          return failure(configRefusal(), { headers });
        }
        if (error instanceof BlockedContractError) {
          log("error", "LA-3-BLOCKED", { correlationId, kind: error.kind });
          return failure(new AppError("INTERNAL_ERROR"), { headers });
        }
        // Unknown error: log name and correlation id only. No message or stack goes to the client.
        log("error", "request.failed", { correlationId, errorName: error?.name ?? "Error" });
        return failure(new AppError("INTERNAL_ERROR"), { headers });
      }
    };
  };
}

let registered = {};

/** Registers A4's `resolveAccess` and `checkMutatingRequest` once they exist (A1 wires this). */
export function configureWithApi(deps) {
  registered = { ...deps };
}

export const withApi = createWithApi();
