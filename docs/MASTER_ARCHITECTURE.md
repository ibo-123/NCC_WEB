# Master Architecture

**Contract revision:** Phase 3, batch B, revision 5 (final candidate for lead review). Subordinate to `DECISIONS.md`. Where this file and `DECISIONS.md` differ, `DECISIONS.md` wins; report the difference.

Status words (`APPROVED`, `PROPOSED`, `OPEN`, `UNVERIFIED`) are defined in `DECISIONS.md` §1. Nothing here claims a build, install, lint, test or render has passed. None was run for this revision.

## 1. Product
NCC DSA Platform supports student accounts, learning resources, problems, attendance, contests, progress and rating workflows, notifications and administrator workflows. The prototype in `design-reference/design` is the visual and product reference. It contains real routes and interaction states; do not treat every prototype state as a URL.

## 2. Technical baseline — APPROVED
Next.js 15 App Router, React 19, JavaScript (not TypeScript), Tailwind CSS v4, MongoDB Atlas with Mongoose, Zod, opaque server-side sessions (hashed tokens), bcryptjs, Vitest, Playwright, dark theme default with a persisted toggle. Do not introduce TypeScript, Prisma, PostgreSQL, a separate Express server or another framework without lead approval.

## 3. Runtime and dependencies

### 3.1 What was checked, and at what level
**Sources read:** `package.json` and `package-lock.json` (lockfileVersion 3) from a shallow clone of `main`, commit `851c94f`; public metadata from `registry.npmjs.org` (latest version, publish date, license, declared `engines`, dependency count) queried on Oct 21, 2026. Age = days between publish date and Oct 21, 2026.

A registry metadata check is **not** security, compatibility, installation or test verification. A declared `engines` value is the publisher's claim, not evidence that the package works on that Node version.

| Verification level | Done? |
|---|---|
| Registry metadata read (version, date, license, declared engines, dependency count) | Yes, for every package in §3.3 and §3.4 |
| Installed (`npm ci`) | **No** |
| Compatibility checked (peer dependencies, behavior with Next 15.5.28 and React 19.1.0) | **No** |
| Security advisories, provenance, signatures and install scripts reviewed | **No** |
| Tests or build run | **No** |

Also not checked: licenses beyond the registry field, bundle impact, and availability of Playwright browsers and the `mongod` binary in the team's environments. Everything marked UNVERIFIED stays so until the corresponding level is actually performed and recorded.

### 3.2 Node.js — PROPOSED, pending lead approval
`package.json` declares no `engines`. Declared Node ranges (registry metadata, not tested):

| Package | Declared Node |
|---|---|
| next 15.5.28 (lock file) | `^18.18.0 \|\| ^19.8.0 \|\| >=20.0.0` |
| mongoose 9.11.2, mongodb 7.7.0, bson 7.3.3 (lock file) | `>=20.19.0` |
| mongodb-memory-server 11.3.0 | `>=20.19.0` |
| @playwright/test 1.63.0 (declared for the latest release; 1.63.0 itself was not separately queried) | `>=20` |
| vitest 5.0.3 | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` |
| vitest 4.1.11 (queried directly; 4.1.12 is identical) | `^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` |

Two options. The Node range and the Vitest line are chosen together; neither is approved.
- **Option 1 (primary):** `engines.node` = `^22.12.0 || ^24.0.0`, with Vitest 5.0.3.
- **Option 2 (fallback, only if the host decision B21 requires Node 20):** `engines.node` = `^20.19.0 || ^22.12.0 || ^24.0.0`, with Vitest 4.1.11. On paper every declared range above admits Node 20.19 or later. This is a metadata match only; **compatibility is UNVERIFIED** and the fallback needs lead approval before use.
- Both ranges deliberately exclude odd-numbered Node releases (21, 23, 25), which Vitest does not declare. A plain `>=20.19.0` would admit them and would not match Vitest's declarations.

### 3.3 Existing dependencies (declared and locked)
| Package | package.json | Locked | Notes (registry, Oct 21, 2026) |
|---|---|---|---|
| next | ^15.5.28 | 15.5.28 | Newest 15.5.x; published 7 days ago |
| react, react-dom | 19.1.0 (exact) | 19.1.0 | 19.1.10 exists (published Oct 14); upgrade not evaluated |
| mongoose | ^9.11.2 | 9.11.2 | Newest 9.x; published 9 days ago |
| zod | ^4.6.7 | 4.6.7 | Newest 4.x; published 9 days ago |
| lucide-react | ^1.57.0 | 1.57.0 | 1.60.0 exists |
| tailwindcss, @tailwindcss/postcss | ^4 | 4.3.3 | Newest 4.x |
| postcss | (transitive) | 8.5.30 | |
| eslint | ^9 | 9.39.5 | |
| eslint-config-next | ^15.5.28 | 15.5.28 | |
| @eslint/eslintrc | ^3 | 3.3.7 | |

Whether to move React to 19.1.10, and whether releases under 14 days old are acceptable, are lead decisions. No advisory check was done.

### 3.4 Proposed additions — PROPOSED, none approved
| Package | Exact version | Published (age) | License | Declared Node | Purpose / note |
|---|---|---|---|---|---|
| bcryptjs | 3.0.3 | 2025-11-02 (352 d) | BSD-3-Clause | none | Password hashing (approved choice); 0 dependencies |
| otpauth | 9.5.2 | 2026-09-03 (47 d) | MIT | none | Admin TOTP, only behind `ADMIN_2FA_ENABLED` (B6 OPEN); 1 dependency. Alternative: otplib 13.5.0 (6 dependencies) |
| qrcode | 1.5.4 | 2024-08-05 (806 d) | MIT | >=10.13 | 2FA enrollment QR; oldest release of the set. Alternative: show the manual key only |
| server-only | 0.0.1 | 2022-09-03 | MIT | none | Marks modules as server-only; Next integration not verified |
| vitest (dev) | 5.0.3 (Option 1) or 4.1.11 (Option 2, published 2026-08-18) | 2026-09-30 (21 d) / 2026-08-18 (64 d) | MIT | see §3.2 | Unit/service tests; line chosen with the Node range |
| @playwright/test (dev) | 1.63.0 | 2026-09-04 (47 d) | Apache-2.0 | >=20 | Browser journeys; browsers install separately |
| mongodb-memory-server (dev) | 11.3.0 | 2026-09-21 (29 d) | MIT | >=20.19.0 | Use `MongoMemoryReplSet` so transactions work; downloads a `mongod` binary |

Not proposed: a date library (use `Intl`), Prettier, React Testing Library/jsdom, Redis, a rate-limit package. Add any of them only with lead approval.

These rows are metadata-checked only (§3.1). **Pinning — PROPOSED:** remove `^` ranges, commit `package-lock.json`, install with `npm ci` in CI.

## 4. Repository layout and ownership
Inspect the repository before changing it. `app/` is currently the untouched create-next-app starter. Target layout (directories created only by the owner):

| Path | Contents | Owner |
|---|---|---|
| `app/` | Routes, layouts, pages, `app/api/**` handlers (thin) | Feature owner of that route |
| `components/ui`, `components/layout` | Shared UI, shells, tokens | A2 |
| `components/<feature>` | Feature UI | Feature owner |
| `lib/http/` | Envelope, errors, pagination, `withApi` | A2 |
| `lib/config/` | Validated environment (`env.js`) | A2 |
| `lib/db/`, `models/` | Connection helper, every model and index | A3 |
| `lib/auth/` | Sessions, guards, `permissions.js` | A4 |
| `lib/security/` | AEAD encryption helper, rate limiting, CSRF check | A4 |
| `lib/validation/` | Shared Zod helpers (not feature schemas) | A2 |
| `lib/services/<domain>/` | Business rules per domain | Domain owner |
| `lib/integrations/` | Codeforces client | A6 |
| `tests/`, `scripts/` | Tests; seed and maintenance scripts | Owner of the code under test; `scripts/seed` by A3 |
| `docs/` | These contracts | A1 |

No two accounts own the same file. Cross-owner changes go through a pull request to the owner.

## 5. Request lifecycle
1. `withApi(...)` wraps every route handler and **requires an access declaration**: either `permission: '<catalogued string>'` or `public: { reason }` (§7). A handler with neither is denied.
2. For mutating requests it checks Origin/Host and JSON content type (`AUTH_AND_SECURITY.md`). The refusal responses for these two checks are BLOCKED until `DECISIONS.md` §4.1 LA-3 is decided (§6.4).
3. **Public route** (listed in `PUBLIC_ROUTES`, §7.1): no session or user is loaded; steps 5–7 still apply.
4. **Any other route:** it resolves the session, then loads the user (`role`, `status`) **from the database on every request**. Role and status are never read from the cookie or cached in the session. It applies the session-state allow-lists (restricted, 2FA-pending, §7.2), then the permission check (§7.3). Page requests get the same state check in server layouts; they are not API requests and grant no API permission (§7.2).
5. Zod validates and strips unknown input; the service applies business rules; resource-level ownership is checked in the service.
6. The handler returns the envelope (§6). Security-relevant mutations write an audit event.
7. Tests cover success, validation failure, unauthenticated, forbidden, restricted and 2FA-pending access, and relevant concurrency.

Handlers hold no business logic. The server is authoritative; hiding a control is not authorization.

**Middleware.** Edge middleware only checks that a session cookie is present (for example to send a visitor with no cookie to the login page). It never reads a user's status or role and never decides restricted or 2FA-pending access, because it cannot reach the database. Those checks run in server layouts and in `withApi`.

## 6. Shared conventions

### 6.1 Data
- IDs exposed to clients are ObjectId strings. Timestamps are stored as UTC and sent as ISO-8601 strings.
- Time zone: `CAMPUS_TIMEZONE=Africa/Addis_Ababa` — PROPOSED, NCC to confirm (B17). Campus-entered date and time are converted to UTC at the service boundary.
- Status values are defined centrally in `DATABASE_SCHEMA.md`; no spelling variants.
- Deletion is soft for lectures, contests, problems, announcements and topics (`DATABASE_SCHEMA.md` §Deletion).
- Never trust client-supplied user IDs, roles, rating, attendance status or ownership.
- Use transactions for multi-document writes. They require a replica set (§9); there is no non-transactional fallback without lead approval.

### 6.2 Pagination (T1) — APPROVED
Query: `page` (1-based, default 1), `limit` (default 20, max 50). Out-of-range values are 400 `VALIDATION_ERROR`.

### 6.3 Envelope — APPROVED
Success: `{ "success": true, "data": ... }`. List `data`: `{ "items": [], "pagination": { "page", "limit", "total", "totalPages" } }`.
Failure: `{ "success": false, "error": { "code", "message", "fields"?, "retryAfterSeconds"? } }`. `fields` is a flat map of field path to message. Stack traces, secrets, hashes and attendance codes never appear in responses. A failure response is complete only when its `code` is APPROVED in §6.4 or has an interim contract there. The five BLOCKED response contracts of §6.4 cannot return a complete envelope until `DECISIONS.md` §4.1 LA-3 is decided.

### 6.4 Canonical error registry (T2)
This is the only list of codes. `API_CONTRACT.md` references it and may not define others. Adding or confirming a code requires the lead's explicit approval and an edit here.

**Status column.** `APPROVED` = covered by the approved T2 decision or the existing API draft. `PENDING` = proposed by this documentation revision and **not yet approved by the lead**. Listing a code in this draft does not approve it.

**Pending-code rule and interim contract.** Implementers do not use a PENDING code, do not choose a substitute, and do not invent a placeholder code. Two cases have an interim contract that uses an **already approved** code in its approved meaning (table below). That interim contract is itself awaiting lead confirmation (`DECISIONS.md` §4.1, LA-1 and LA-2) and does not approve the pending code.

| Situation | Final code (PENDING) | Interim contract (approved code) |
|---|---|---|
| Genuine missing or invalid required configuration, or a dependency failure of ours (every failure scope in §8.2) | `FEATURE_NOT_CONFIGURED` | HTTP 503 with `DEPENDENCY_UNAVAILABLE` (the approved T2 assigns 503 to 'our DB/config'), generic message 'The service is temporarily unavailable.' No variable name appears in the client response; the name, never the value, is logged. One helper in `lib/http` produces this refusal, so the final code changes in one place. |
| Registration email already registered | `EMAIL_ALREADY_REGISTERED` | HTTP 409 with `CONFLICT` and `fields.email`. This reveals that the email is registered, as the prototype does. Whether to keep that is the open B3 account-enumeration trade-off and is not decided here. |

**Features blocked by unresolved business decisions.** A feature that cannot work because a business decision is OPEN (currently the B1 recalculation endpoint before approval) is not a configuration or dependency failure. No approved code and no approved interim mapping covers it, and `DEPENDENCY_UNAVAILABLE` is **not** claimed to apply. Its pre-approval response contract is **BLOCKED** until the lead records a decision in `DECISIONS.md` §4.1 LA-1(b): the endpoint is not released before then, and no code is invented or reused. This is separate from the five BLOCKED contracts below.

**Blocked response contracts.** Five PENDING codes have neither an approved code nor an approved interim mapping. A failure envelope requires an `error.code` (§6.3), so a complete, valid response cannot be defined or returned for these cases until the lead records an approval. Their response contracts are **BLOCKED** until `DECISIONS.md` §4.1 LA-3 records, for each one, either approval of the code or an approved interim mapping to an approved code. Until then do not implement or release the response, and do not reuse another code. The intended refusal behavior and HTTP status are preserved below so the decision can be made. They are not a response contract.

| Situation | Intended refusal | Intended HTTP | Response contract |
|---|---|---|---|
| Registration while `REGISTRATION_MODE` is closed | Request is not processed | 403 | **BLOCKED** (`REGISTRATION_CLOSED`) |
| Login failure, identical for unknown email and wrong password | No session is created | 401 | **BLOCKED** (`INVALID_CREDENTIALS`) |
| Wrong or expired 2FA code | Session stays awaiting 2FA | 401 | **BLOCKED** (`TWO_FACTOR_INVALID`) |
| Failed Origin/Host check on a mutating request | Request is not processed | 403 | **BLOCKED** (`CSRF_REJECTED`) |
| Mutating request that is not JSON | Request is not processed | 415 | **BLOCKED** (`UNSUPPORTED_MEDIA_TYPE`) |

Work that depends on a blocked contract (for example the login failure path or the CSRF check) may proceed up to, but not including, its response body. Releasing any route that depends on one waits for the lead's decision.

Registry:

| Code | HTTP | Use | Status |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Any invalid body, query or path parameter (no 422 anywhere) | APPROVED |
| `UNAUTHENTICATED` | 401 | No valid session, or a session awaiting 2FA used outside its allow-list | APPROVED |
| `FORBIDDEN` | 403 | Authenticated but not permitted | APPROVED |
| `ACCOUNT_RESTRICTED` | 403 | Restricted user outside the allowed routes | APPROVED |
| `NOT_FOUND` | 404 | Missing, soft-deleted or concealed resource | APPROVED |
| `CONFLICT` | 409 | Duplicate unique value (also the interim response for a duplicate registration email, above) | APPROVED |
| `INVALID_STATE` | 409 | Illegal state transition (for example deleting a topic that has problems) | APPROVED |
| `ATTENDANCE_INVALID_CODE` | 400 | Wrong attendance code | APPROVED |
| `ATTENDANCE_EXPIRED` | 409 | Session past its expiry | APPROVED |
| `ATTENDANCE_NOT_ACTIVE` | 409 | No open session for the lecture | APPROVED |
| `ATTENDANCE_DUPLICATE` | 409 | Student already checked in | APPROVED |
| `RATE_LIMITED` | 429 | Rate limit or attempt lockout; carries `retryAfterSeconds` | APPROVED |
| `INTERNAL_ERROR` | 500 | Unexpected failure, including undecryptable stored data; generic message | APPROVED |
| `UPSTREAM_ERROR` | 502 | An external API (Codeforces) failed or returned an unusable answer | APPROVED |
| `DEPENDENCY_UNAVAILABLE` | 503 | Our own dependency unavailable: the database, or genuinely missing or invalid required configuration (T2: 'our DB/config'); also the interim configuration refusal above. Not used for features waiting on OPEN business decisions (LA-1(b)) | APPROVED |
| `REGISTRATION_CLOSED` | 403 | Registration not open under `REGISTRATION_MODE` (B3 seam) | **PENDING**; response contract **BLOCKED** (LA-3) |
| `FEATURE_NOT_CONFIGURED` | 503 | Proposed for genuinely missing or invalid required configuration. Interim: see above. Whether it, or any code, may also cover features waiting on OPEN business decisions is part of LA-1(b) | **PENDING** |
| `INVALID_CREDENTIALS` | 401 | Login failure; identical response for unknown email and wrong password | **PENDING**; response contract **BLOCKED** (LA-3) |
| `TWO_FACTOR_INVALID` | 401 | Wrong or expired 2FA code (only when `ADMIN_2FA_ENABLED`) | **PENDING**; response contract **BLOCKED** (LA-3) |
| `EMAIL_ALREADY_REGISTERED` | 409 | Registration email exists (prototype behavior; B3 trade-off). Interim: see above | **PENDING** |
| `CSRF_REJECTED` | 403 | Origin/Host check failed on a mutating request | **PENDING**; response contract **BLOCKED** (LA-3) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Mutating request that is not JSON | **PENDING**; response contract **BLOCKED** (LA-3) |

### 6.5 Validation
Zod 4 is installed. Its error API differs from Zod 3, so do not paste Zod 3 snippets. One shared helper converts Zod issues to `fields`. Each domain owns its own schemas.

### 6.6 Next.js 15 specifics
In Next 15, `cookies()`, `headers()` and route `params`/`searchParams` are asynchronous and must be awaited. A2 confirms this against the Next 15.5 documentation and records anything different.

### 6.7 Logging
Each request gets a `correlationId`, written to audit rows and error logs. Logs never contain passwords, tokens, 2FA secrets, encryption keys or attendance codes.

## 7. Authorization: explicit server-side permission map — APPROVED (B14 policy OPEN)
`lib/auth/permissions.js` (A4) exports the role→permission map, `can(role, permission)` and the `PUBLIC_ROUTES` list. **Deny by default:** every route is either a public route declared in §7.1 or carries one catalogued permission from §7.3. An undeclared, unknown or unmapped permission is denied.

### 7.1 Public routes — explicit and reviewable
A public route is declared with `withApi({ public: { reason } })` **and** appears in `PUBLIC_ROUTES` as `{ method, path, reason }`. Public routes load no session or user, but still get the CSRF and content-type check, Zod validation and rate limiting. The v1 list is exactly:

| Method and path | Reason |
|---|---|
| `POST /api/auth/register` | No account exists yet (policy gated by `REGISTRATION_MODE`, B3) |
| `POST /api/auth/login` | No session exists yet |

Adding a public route means editing this table and `PUBLIC_ROUTES` in one reviewed change with lead approval. Declaring `public` does not touch the permission catalog, and the catalog does not contain public routes.

### 7.2 Session states and allow-lists
Every authenticated request is in exactly one state, evaluated from the database each time:
- **Active:** normal permission check (§7.3).
- **Restricted** (`status: restricted`): only `auth.me` and `auth.logout`. Everything else is `ACCOUNT_RESTRICTED`.
- **Awaiting 2FA** (session created by login when `ADMIN_2FA_ENABLED` is on and the admin has 2FA enrolled, `twoFactorVerified: false`): only `auth.2fa.verify` and `auth.logout`. Everything else is `UNAUTHENTICATED`.

**Page access versus API authorization.** These are separate checks driven by the same session state. API authorization is the permission check: a restricted user's API permissions are exactly `auth.me` and `auth.logout` (login is public, §7.1). Page access is a routing rule applied in server layouts: a restricted user who requests an application page is redirected to `/restricted`, and `/restricted` itself, the login page and static assets stay reachable. Allowing the `/restricted` page grants **no** additional API permission. The page is rendered on the server from the same data `auth.me` returns (status and rating snapshot) and from `RESTRICTED_CONTACT_EMAIL` (§8.2), and needs no other endpoint. Every other API request from a restricted user is refused with `ACCOUNT_RESTRICTED`.

`auth.2fa.verify` is **not public**. It is a catalogued permission mapped to `admin` and additionally gated by session state: it succeeds only for a session awaiting 2FA, and is denied to every other state, including an already verified session. A pending session is never treated as authenticated for any other route. When `TWOFA_ENCRYPTION_KEY` is missing or invalid, `auth.2fa.verify` is refused under the Admin 2FA scope of §8.2; the session stays awaiting 2FA and is never marked verified.

### 7.3 Permission catalog
- Roles are `student` and `admin`. In v1 every `admin.*` and admin-management permission maps to `admin` alone. Admin is **not** mapped to student permissions; whether admins may use student pages is OPEN (B14).
- Granular permissions later mean editing this map, not the handlers.

| Permission | student | admin |
|---|---|---|
| `auth.me`, `auth.logout` | ✓ | ✓ |
| `auth.2fa.verify` (state-gated, §7.2; only when `ADMIN_2FA_ENABLED`) | — | ✓ |
| `profile.handles.update`, `dashboard.read`, `announcements.read`, `notifications.read`, `lectures.read`, `attendance.checkin`, `attendance.read`, `progress.read`, `problems.read`, `problems.check`, `contests.read`, `results.read`, `rating.read`, `streak.read` | ✓ | — |
| `admin.dashboard.read`, `users.read`, `auditlog.read` | — | ✓ |
| `users.restrict`, `users.reopen` | — | ✓ |
| `announcements.manage`, `announcements.publish`, `announcements.delete` | — | ✓ |
| `lectures.manage`, `lectures.publish`, `lectures.delete` | — | ✓ |
| `attendance.manage` (start, close), `attendance.admin.read` | — | ✓ |
| `topics.manage`, `topics.delete`, `problems.manage`, `problems.publish`, `problems.delete` | — | ✓ |
| `contests.manage`, `contests.publish`, `contests.delete`, `results.fetch`, `results.publish` | — | ✓ |
| `rating.admin.read`, `rating.recalculate`, `progress.admin.read` | — | ✓ |
| `twofa.enroll` (only when `ADMIN_2FA_ENABLED`) | — | ✓ |

### 7.4 Route coverage rule
Every implemented route handler under `app/api/**` is accounted for **exactly once**: by one catalogued permission, or by one `PUBLIC_ROUTES` entry. Four controls enforce this:
1. Runtime: `withApi` denies a handler with no valid declaration.
2. A required automated check, owned by A4, that enumerates `app/api/**/route.js` and fails on a handler with no declaration, an unknown permission, or a `public` declaration absent from `PUBLIC_ROUTES`. **This check does not exist yet and has not been run.**
3. `API_CONTRACT.md` (batch E) lists every endpoint with its permission or its public declaration, using exactly these strings.
4. Review: a pull request that adds a route shows the declaration in the diff.

The catalog is final only when `API_CONTRACT.md` is approved; that document must use these strings exactly or propose additions through the lead.

## 8. Configuration

### 8.1 Environment variables
`.env.example` holds placeholders only and is the only committed env file. Defaults marked PROPOSED are engineering defaults awaiting NCC (`DECISIONS.md` B4, B17). Secrets and keys have no default. A default shown in this table applies only when the variable is absent (§8.2).

| Variable | Required | Default / format | Status |
|---|---|---|---|
| `NODE_ENV` | yes | set by Next | — |
| `MONGODB_URI` | yes | Atlas URI, replica set | APPROVED |
| `APP_URL` | yes | absolute origin; used for the Origin check | APPROVED |
| `SESSION_SECRET` | yes | ≥32 random bytes; HMAC key for session-token hashing | APPROVED |
| `CAMPUS_TIMEZONE` | no | `Africa/Addis_Ababa` | PROPOSED |
| `REGISTRATION_MODE` | no | `closed` (production default; an absent or invalid value is treated as `closed`, §8.2) or `open` (only if explicitly set) | B3 seam |
| `ADMIN_2FA_ENABLED` | no | `false` | B6 seam |
| `TWOFA_ENCRYPTION_KEY` | only if 2FA enabled | base64, exactly 32 bytes | B6 seam |
| `ATTENDANCE_CODE_ENCRYPTION_KEY` | yes in production (attendance scope, §8.2) | base64, exactly 32 bytes | APPROVED (T4) |
| `ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS` | no | same format; rotation only | APPROVED (T4) |
| `ATTENDANCE_DEFAULT_VALID_SECONDS` | no | 600 | PROPOSED |
| `ATTENDANCE_MAX_ATTEMPTS` | no | 5 | PROPOSED |
| `ATTENDANCE_LOCKOUT_SECONDS` | no | 900 | PROPOSED |
| `BCRYPT_COST` | no | interim 12; **UNVERIFIED** until benchmarked on the host | T19 |
| `RESTRICTED_CONTACT_EMAIL` | yes in production (restricted-contact scope, §8.2) | one email address; no default; the prototype's address is not hard-coded | B20 |
| `RATING_WARNING_THRESHOLD`, `RESTRICTION_RATING_THRESHOLD` | no | unset = no warning, no automatic restriction | B2 seam |
| `STREAK_QUALIFYING_TYPES` | no | unset = streak disabled | B5 seam |
| `CODEFORCES_API_KEY`, `CODEFORCES_API_SECRET` | no | from the audit; whether the integration needs them is UNVERIFIED | A6 to confirm |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed script only | never read by the app at runtime | A3 |
| Rate-limit settings | — | names and values are defined in `AUTH_AND_SECURITY.md` | batch D |

`CRON_SECRET` is reserved and not defined in v1 (no scheduler, B21). What happens when a required variable is missing or invalid depends on its scope; see §8.2.

### 8.2 Startup validation, readiness and failure scope
`lib/config/env.js` (A2) parses the environment with Zod and exports typed values; no other module reads `process.env`.

**Failure scopes.** A missing or invalid required variable is handled by its scope. "Refused" below means the interim configuration refusal of §6.4 (HTTP 503 `DEPENDENCY_UNAVAILABLE`, subject to LA-1; `FEATURE_NOT_CONFIGURED` is PENDING and is not used).

**Defaults.** Two kinds of variable are treated differently.
- **Cryptographic secrets and keys** (`SESSION_SECRET`, `TWOFA_ENCRYPTION_KEY`, `ATTENDANCE_CODE_ENCRYPTION_KEY`, `ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS`) never have a default. They never default to a dummy, example, runtime-generated or plaintext value, and there is no plaintext fallback.
- **Policy and tuning settings** take a default **only where this contract expressly states one** (§8.1 or the table below). A stated default applies only when the variable is absent; a present but invalid value is a validation failure for its scope and is never silently replaced by a default. The one fail-closed policy default that also covers an invalid value is `REGISTRATION_MODE` → `closed`. This section introduces no other default.

| Scope | Variables | If missing or invalid |
|---|---|---|
| **Core** | `MONGODB_URI`, `SESSION_SECRET`, `APP_URL` | Application-wide: the process refuses to start, or every API route (public ones included) is refused and pages render a generic unavailable page with status 503. |
| **Attendance** | `ATTENDANCE_CODE_ENCRYPTION_KEY`; `ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS` when present; `ATTENDANCE_DEFAULT_VALID_SECONDS`, `ATTENDANCE_MAX_ATTEMPTS`, `ATTENDANCE_LOCKOUT_SECONDS` | Attendance-related functionality is disabled: every route carrying an `attendance.*` permission is refused, and attendance pages show an unavailable state. Dashboards and lecture reads stay available and omit attendance data instead of failing. Authentication and all unrelated features stay available. |
| **Admin 2FA** | `TWOFA_ENCRYPTION_KEY`, only when `ADMIN_2FA_ENABLED=true` | Enrollment (`twofa.enroll`) and verification (`auth.2fa.verify`) are refused with the interim configuration refusal, never with `FEATURE_NOT_CONFIGURED`. A session awaiting 2FA **remains** awaiting 2FA: it is never marked verified, never treated as authenticated for another route, and keeps the §7.2 allow-list (`auth.2fa.verify`, which is refused, and `auth.logout`, which works). Invalid configuration never bypasses 2FA. Students, admins without enrollment and all other features are unaffected. |
| **Registration** | `REGISTRATION_MODE` | Registration only. This is the one fail-closed policy default: an absent or invalid value is treated as `closed` and logged (§8.1, B3). It is not a secret and does not change the registration policy. |
| **Restricted contact** | `RESTRICTED_CONTACT_EMAIL` | See the paragraph below. Only the contact element of `/restricted` is affected. |

**Variables not listed.** An invalid value disables only the one feature that reads it. If more than one feature reads it, or it affects authentication or data integrity (for example `CAMPUS_TIMEZONE`, `BCRYPT_COST`), treat it as Core. This default is flagged for lead confirmation (`DECISIONS.md` §4, LA-4).

**Restricted contact (`RESTRICTED_CONTACT_EMAIL`).** It is required in production and is not treated as optional. A valid value is a single email address (no display name, at most 254 characters, not the `.env.example` placeholder). If it is missing or invalid in production, only the restricted-account contact workflow is affected: `/restricted` still renders the user's status and rating, omits the contact link, and shows a neutral message that contact details are unavailable. The prototype's address is never used as a fallback. Restriction enforcement, authentication and every other feature are unaffected. The failure is logged at readiness on every process start with the variable name, and is a release-checklist defect to fix before launch. Why this scope is enough: restriction enforcement does not depend on a contact address, and refusing the page would only hide the explanation from the affected user without improving security. Lead confirmation is requested (`DECISIONS.md` §4, LA-5).

**Production rule.** Production must never serve a function whose required configuration is missing or invalid. A Core failure blocks the application. Any other failure disables only the scope in the table, and the application keeps serving whatever has valid configuration.

1. **Preferred — process-level validation.** Validate at server start so a misconfigured deployment fails fast. Process exit is reserved for **Core** failures; a feature-scoped failure never terminates the process. This cannot be guaranteed: it depends on Next's startup hook and on the host. A2 confirms in the Next.js 15.5 documentation that `instrumentation.js` supports a server-start check; until confirmed, treat it as **UNVERIFIED**.
2. **Mandatory — readiness fallback.** `withApi` and server-rendered pages call `assertConfigReady(scope)`. A Core failure refuses everything as in the table. A feature-scoped failure refuses only that scope. The result is computed once per process and logged with the variable name, never its value.
3. **No readiness endpoint in v1.** The audit's `/admin/system/health` was removed (T11). A host health check would need an approved addition.
4. **Build.** Validation runs when called at runtime, not when a module is imported, so `next build` should not need production secrets. This is **UNVERIFIED** until a build is actually run.
5. **Development and test.** The same scopes apply. The dev server stays up on a Core failure and refuses requests instead of exiting.
6. **Never place a default, dummy or example key in code.** Validation rejects the `.env.example` placeholder text, and rejects any two of `SESSION_SECRET`, `TWOFA_ENCRYPTION_KEY` and `ATTENDANCE_CODE_ENCRYPTION_KEY` being equal.

### 8.3 Authenticated encryption: attendance codes (T4) and admin 2FA secrets
- **Algorithm:** AES-256-GCM through Node `crypto`, implemented once in `lib/security/aead.js` (A4) and reused for 2FA secrets.
- **Key:** `ATTENDANCE_CODE_ENCRYPTION_KEY` is 32 random bytes, base64-encoded (for example `openssl rand -base64 32`). Validation decodes it and requires exactly 32 bytes, rejecting placeholders. Keys live only in the deployment secret store, never in the repository or logs.
- **Per value:** a fresh random 12-byte IV and a 16-byte tag. Stored form: `v1.<keyId>.<iv>.<tag>.<ciphertext>` (base64url). `keyId` is the first 8 hex characters of SHA-256 of the key, so it reveals nothing useful and selects the current or previous key.
- **Authenticated context (associated data), defined per purpose.** The helper takes the purpose and the owner identifier as arguments (for example `encrypt(purpose, ownerId, plaintext)` and `decrypt(purpose, ownerId, value)`), rejects any unknown purpose, builds the associated data as `<purpose label>:<owner identifier>` from fixed constants, and does not store the context in the value.

| Purpose | Purpose label | Owner identifier |
|---|---|---|
| Attendance code | `attendance-code` | the attendance session identifier |
| Admin 2FA secret | `admin-2fa-secret` | the administrator's stable user identifier |

- **Matching context only.** Decryption must use exactly the purpose label and owner identifier used at encryption. A mismatch of either, or any authentication failure, fails safe: no plaintext is returned, no other context or key is tried, the failure is logged without the plaintext, the key or the stored value, and the caller returns `INTERNAL_ERROR`. For attendance, the admin closes the session and starts a new one. For 2FA, the session stays awaiting 2FA and is never marked verified.
- **Purpose-bound keys.** The helper maps each purpose to its own configured key set and to no other. Attendance codes use only `ATTENDANCE_CODE_ENCRYPTION_KEY` and, when present, `ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS`. Admin 2FA secrets are encrypted and decrypted only with `TWOFA_ENCRYPTION_KEY`. `keyId` validation is limited to the configured key or keys of that purpose: a stored 2FA value must carry the `keyId` of `TWOFA_ENCRYPTION_KEY`, and a `keyId` that matches nothing configured for the purpose means the value is undecryptable and fails safe (no plaintext, `INTERNAL_ERROR`; the session stays awaiting 2FA and is never marked verified). The helper never tries an attendance key, any cross-purpose key or any undocumented fallback key for a 2FA secret, and never tries `TWOFA_ENCRYPTION_KEY` for an attendance code.
- **Scope of the key rules below.** Key selection, previous-key configuration and rotation below are written for the attendance keys. `TWOFA_ENCRYPTION_KEY` uses the same algorithm and context rule and is bound as described above. This document defines no previous-key variable for it. Rotation procedures for it are deferred to `AUTH_AND_SECURITY.md` (batch D); until then the only key for 2FA secrets is `TWOFA_ENCRYPTION_KEY`.
- **Key selection.** Encryption **always** uses the current key (`ATTENDANCE_CODE_ENCRYPTION_KEY`). Decryption reads the `keyId` stored in the value and selects the matching key from the attendance current and previous keys; it never tries keys in turn. A `keyId` that matches neither key means the value is undecryptable and fails safe (below).
- **Previous-key configuration.** `ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS` is either **absent** (no previous key) or **valid**: base64, exactly 32 bytes, different from the current key, with a `keyId` different from the current key's. A value that is present but empty or whitespace, malformed, the wrong length, or equal to the current key is a validation failure in the **Attendance** scope of §8.2: attendance-related functionality is disabled in every environment, production included, and authentication and unrelated features stay available. It is never silently ignored.
- **Lifetime:** the ciphertext is nulled when the session closes or expires. The plaintext code is shown only to admins through the admin endpoint and compared in constant time on check-in.
- **Fail safe:** a missing or invalid key puts the **Attendance** scope of §8.2 in the refused state in every environment, production included: attendance-related functionality is disabled, while authentication and unrelated features stay available as long as Core configuration is valid. It never stops the process and never blocks other routes. There is no plaintext fallback and no default key. A value that fails to decrypt or authenticate (tampering, a wrong context or a missing key) follows the matching-context rule above.
- **Rotation:** (1) generate a new key; (2) set `…_KEY` to the new key and `…_KEY_PREVIOUS` to the old one, then deploy; (3) once every session opened before the deploy has closed or expired (at least the longest allowed validity), remove `…_PREVIOUS`. Validation rejects `…_PREVIOUS` equal to the current key. On suspected exposure, rotate immediately and drop the previous key; open sessions then fail safe. The routine rotation interval is an operations decision tied to B21 and is not defined here.

## 9. Environments and testing
- **Replica set required** for development and test, because transactions are required (§6.1). Use Atlas, or a local replica set, or `MongoMemoryReplSet`. A standalone `mongod` or a plain in-memory server does not support transactions.
- Vitest covers services and helpers; Playwright covers critical journeys. Both are PROPOSED additions (§3.4) until the lead approves them.
- Baseline `lint` and `build` have not been run (§3.1). Record the first real results as the baseline before any feature work.

## 10. UI foundation (T23)
Preserve the prototype's design direction. Approved approach: port the prototype CSS with Tailwind v4 `@theme` tokens, port the prototype's custom icons (lucide only for gaps), theme stored in a cookie and applied on `<html data-theme>`, promote the hard-coded prototype colors (`#c4232c`, `#0f7a3a`, `#e23b48`) to tokens, add missing badge styles (draft, completed, unsolved, neutral), and build shared components before pages.
- **PROPOSED:** viewport breakpoints 1100/800/420 px. The prototype uses container queries.
- **UNVERIFIED:** breakpoint choices, container behavior and visual fidelity until validated by actual rendering at 1440, 1280, 768 and 390 CSS pixels in both themes. The prototype has not been rendered in this review.
- No control ships without a working handler (B20).

## 11. Quality gates
Before a task is complete: run the relevant lint, build and tests; add tests for business logic and authorization; check desktop and mobile for UI work; report the exact commands and results. Never claim a command passed if it was not run. Do not hide existing failures; separate new failures from baseline failures.
