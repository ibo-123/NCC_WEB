# Decisions and Open Questions

**Contract revision:** Phase 3, batches A–B, revision 5 (final candidate for lead review). Canonical record of approved decisions. Change it only after the project lead confirms. Sibling documents must not contradict it; if they do, stop and report.

## 1. Status vocabulary
| Status | Meaning | Implementer rule |
|---|---|---|
| `APPROVED` | Lead-approved technical decision. | Follow it. |
| `V1-DIRECTION` | Lead-approved direction for v1; not final institutional policy. | Follow it; do not describe it as NCC policy. |
| `PROPOSED` | Engineering default awaiting NCC confirmation. | Build it configurable; do not present it as final. |
| `OPEN` | No rule exists. | Build only the named seam. Do not choose a policy. Report a blocker if the seam is not enough. |
| `UNVERIFIED` | A claim that has not been checked by running or rendering. A registry metadata read is not verification of security, compatibility, installation or tests. | Do not state it as fact. |
| `PENDING` | Proposed by the documentation revision; **not yet approved by the lead**. Listing it in a draft does not approve it. | Do not implement or substitute it until the lead confirms. |
| `BLOCKED` | A response or behavior whose contract cannot be completed until a named lead decision is recorded. | Do not implement or release it. Do not invent a placeholder or reuse another code. |

**Approvers.** Technical decisions: project lead. Institutional policy (rating, restriction, attendance rules, identity, retention): NCC owner, via the lead.

**Rule.** Do not turn a recommendation into a requirement. No document may claim a build, lint, test or render passed unless the command or rendering was actually run and its output recorded.

## 2. Team structure (L1) — APPROVED
| Account | Role | Owns |
|---|---|---|
| A1 | Lead | Architecture, approvals, integration, merges, shared contracts |
| A2 | UI/Foundation | Tokens, theme, shared components, shells, `lib/http`, CI |
| A3 | Database | Connection helper, all models and indexes, seed script, schema tests, AuditLog/Notification/ActivityEvent helpers |
| A4 | Auth/Security | Sessions, guards, rate limiting, 2FA, profile/handles, restriction enforcement, admin users |
| A5 | Learning | Announcements, lectures, attendance, notifications, student dashboard (+ their admin screens) |
| A6 | Competition | Topics/problems/progress/verification, contests/results, rating, streak, Codeforces client (+ their admin screens) |

Rules: each account works on an isolated branch and submits pull requests; no two accounts own the same file; A3 publishes agreed schemas and interfaces before feature work depends on them. Details: `TEAM_WORKFLOW.md`.

## 3. Approved technical baseline — APPROVED
Next.js 15 App Router, React 19, JavaScript, Tailwind CSS v4, MongoDB Atlas, Mongoose, Zod; opaque server-side sessions (token stored hashed) in HttpOnly cookies; bcryptjs; preserve prototype styling/tokens, dark default with theme toggle; Vitest and Playwright; short-lived feature branches and PRs, lead merges to main.

## 4. Technical decisions T1–T24
Specified in the document named in the last column.

| ID | Decision | Status | Spec |
|---|---|---|---|
| T1 | Pagination: `page`, `limit` (default 20, max 50); response `pagination{page,limit,total,totalPages}`. | APPROVED | MASTER §6, API |
| T2 | One error registry. All bad input is 400 `VALIDATION_ERROR` (no 422). Attendance codes, 429 lockout, 502 `UPSTREAM_ERROR` (external API), 503 `DEPENDENCY_UNAVAILABLE` (our DB/config). The canonical registry is `MASTER_ARCHITECTURE.md` §6.4; `API_CONTRACT.md` references it and defines no codes outside it. Codes marked PENDING there await explicit lead confirmation; the registry also holds the interim contract for two of them (`MASTER_ARCHITECTURE.md` §6.4, LA-1, LA-2). The response contracts for the other five are BLOCKED until LA-3 is decided. | APPROVED (seven codes PENDING) | MASTER §6.4, API |
| T3 | Attendance routes are lecture-based for students and under `/api/admin` for admins. No record-correction endpoint until B4. | APPROVED | API |
| T4 | **Amended.** A retrievable attendance code is protected with authenticated encryption (AES-256-GCM via Node `crypto`, random IV per value, key from env; the associated data binds a purpose label and the owner identifier: attendance codes use the attendance purpose label and the session id, admin 2FA secrets use the 2FA purpose label and the administrator's user id, decryption must use exactly the matching context, and each purpose uses only its own configured key: admin 2FA secrets only `TWOFA_ENCRYPTION_KEY`, attendance values only the attendance keys, never a cross-purpose or fallback key, `MASTER_ARCHITECTURE.md` §8.3). `select:false` is only an accidental-exposure guard, not protection. The code is cleared on close/expiry, compared in constant time, generated with `crypto.randomInt`, and never appears in student responses, logs or audit rows. Key provisioning, startup validation and rotation: `MASTER_ARCHITECTURE.md` §8.3. Missing or invalid encryption configuration fails safe: attendance-related functionality is disabled in every environment under the interim configuration refusal (HTTP 503, `MASTER_ARCHITECTURE.md` §6.4; the code `FEATURE_NOT_CONFIGURED` is PENDING), while authentication and unrelated features stay available when Core configuration is valid. There is no plaintext fallback and no default key. | APPROVED | MASTER §8.3, DB, AUTH |
| T5 | Brute-force protection: attempt counters in the rate-limit collection keyed session+user, plus a per-session cap and per-IP limit. Values configurable (see B4). | APPROVED | AUTH |
| T6 | Attendance model: records exist only for check-ins; "missed" is derived; `lectureId` required; one open session per lecture (partial unique index). | APPROVED | DB |
| T7 | Lecture `state` comes from one server function. Its final rules are OPEN (B12). | APPROVED (rules OPEN) | DB, SERVICES |
| T8 | Status vocabulary: Announcement/Lecture/Problem `status` draft\|published; Contest `publication` draft\|published and `resultsState` not_fetched\|fetched\|published; derived contest status upcoming\|active\|completed. Scheduled publishing is removed. | APPROVED | DB |
| T9 | **Amended.** Soft deletion for lectures, contests, problems, **announcements and topics**. A topic cannot be deleted while it has non-deleted problems (409 `INVALID_STATE`). Related-record effects are in `DATABASE_SCHEMA.md` §Deletion. No restore endpoint in v1. | APPROVED | DB, API |
| T10 | v1 auth routes: register, login, logout, me, handles; 2FA enrollment and login challenge. Forgot/reset password, change password, `PATCH /users/me`, 2FA disable and recovery codes are held. | APPROVED | API, AUTH |
| T11 | The audit's endpoint list is the base. Draft-only endpoints (`/leaderboard`, `/integrations/*`, `/admin/system/health`, generic `PATCH /admin/users/:id`, `/users/me/password`, results `import`) are removed. | APPROVED | API |
| T12 | `/me` suffix convention for student self-reads. | APPROVED | API |
| T13 | Solve verification only; no `/integrations/*`; synchronous with timeout; unique index on normalized handles. Ownership proof is OPEN (B8). Until B8 is decided the result is a **provisional solve check**, not completed ownership or solve verification (see B8). | APPROVED | API, DB |
| T14 | Results flow: fetch (idempotent upsert on contest+user) → review → publish. No manual import (B9). | APPROVED | API |
| T15 | RatingHistory with `change`, `source`, `components`, `runId`, `formulaVersion`; cached `User.ratingCurrent` written only by the rating service in the same transaction as the history row; math behind `computeRating(inputs, config)`. Formula OPEN (B1). | APPROVED (formula OPEN) | DB, SERVICES |
| T16 | Materialized ActivityEvent, unique `(userId,type,refId)`, `day` in campus time zone. Qualifying types OPEN (B5). | APPROVED (types OPEN) | DB, SERVICES |
| T17 | **Amended.** Restrictions are enforced server-side on every request. **API:** a restricted user may use only login (public), `auth.me` and `auth.logout`; every other API request is `ACCOUNT_RESTRICTED`. **Pages:** a restricted user is redirected to the `/restricted` page, which stays reachable together with the login page and static assets. Page access is a routing rule and grants no additional API permission (`MASTER_ARCHITECTURE.md` §7.2). Sessions are **not** revoked on restriction (status is checked per request). Sessions **are** revoked on logout, expiry, admin 2FA reset, role change and account deletion. Edge middleware only checks cookie presence and never reads status or role; restricted redirects happen in server layouts. Role and status are read from the database on every request and are never cached in the cookie or session, so a role change takes effect on the next request even if no session was revoked. A role change made through the service revokes that user's sessions; a manual database edit does not, and relies on the per-request check. What "restricted" means institutionally is OPEN (B2). | APPROVED | MASTER §7, AUTH, API |
| T18 | Cookie path `/`, HttpOnly, SameSite=Lax, Secure in production. CSRF: Origin/Host check on every mutating request plus JSON-only bodies. | APPROVED | AUTH |
| T19 | **Amended.** Password length is validated as bytes (`Buffer.byteLength`, max 72) identically on client and server; min 8 per prototype. Session stores a user-agent summary only, plus `reauthAt`. `SESSION_SECRET` is the HMAC key for token hashing. bcrypt cost is **not final**: it is configurable and must be benchmarked on the deployment environment before being fixed (blocked on B21). | APPROVED (cost UNVERIFIED) | AUTH |
| T20 | Every route declares either one permission string or an explicit, reviewable public-route entry (`PUBLIC_ROUTES`; v1: register and login only). A server-side map (`lib/auth/permissions.js`, catalog in `MASTER_ARCHITECTURE.md` §7) maps the roles `student` and `admin` to permission strings; an undeclared or unmapped permission is denied. In v1 all admin permissions map to the single `admin` role, so granular permissions can be added later (B14). A session awaiting 2FA may use only `auth.2fa.verify` (a catalogued, state-gated admin permission, **not** a public route) and `auth.logout`. Every implemented route must be covered by a permission or a public entry (`MASTER_ARCHITECTURE.md` §7.4). Separate student/admin dashboards. Admin notifications are a view over AuditLog. | APPROVED | MASTER §7, AUTH, API |
| T21 | **Amended.** `MASTER_ARCHITECTURE.md` lists exact dependencies and versions for lead review, all required environment variables, and the replica-set requirement for dev/test. Nothing is claimed to have built or passed. Versions and the sources checked are in `MASTER_ARCHITECTURE.md` §3. | APPROVED | MASTER §3, §8 |
| T22 | **Amended.** Canonical docs live in `docs/`; the root `README.md` links to them. Layout: `lib/http`, `lib/auth`, `lib/services`, `lib/integrations`. Services contract, DTOs and permission matrix are added. | APPROVED | README, SERVICES, API |
| T23 | **Amended.** Keep the prototype's design direction: CSS port plus Tailwind `@theme`, prototype icons, theme cookie on `<html data-theme>`, hard-coded colors promoted to tokens, missing badge styles added, Mongo-backed rate limiting. Breakpoints 1100/800/420 are PROPOSED. Container behavior and visual fidelity are **UNVERIFIED** until validated by actual rendering. | APPROVED (fidelity UNVERIFIED) | MASTER |
| T24 | Audit log: actor, action, entityType/Id, summary, meta, `correlationId`; `domain.verb` action registry covering every admin mutation. | APPROVED | DB, AUTH |

**Error codes PENDING lead confirmation.** Seven codes in the registry (`MASTER_ARCHITECTURE.md` §6.4) were proposed by this revision and are **not approved**: `REGISTRATION_CLOSED` (403, B3 seam), `FEATURE_NOT_CONFIGURED` (503, proposed only for genuinely missing or invalid required configuration), `INVALID_CREDENTIALS`, `TWO_FACTOR_INVALID`, `EMAIL_ALREADY_REGISTERED`, `CSRF_REJECTED` and `UNSUPPORTED_MEDIA_TYPE`. Appearing in this draft, in the registry or in a seam description does not settle their status. Implementers do not use them, do not choose substitutes and do not invent placeholders. Two of them have an interim contract that uses an already approved code (duplicate email: `CONFLICT`; genuine configuration or dependency failures: `DEPENDENCY_UNAVAILABLE`, `MASTER_ARCHITECTURE.md` §6.4); those interim contracts are themselves awaiting confirmation (LA-1, LA-2). The other five have no approved code and no approved interim mapping, so their response contracts are **BLOCKED** until LA-3 is decided; for those five, the intended refusal behavior and HTTP statuses are preserved in the registry but are not a response contract. Features waiting on an unresolved business decision (currently the B1 recalculation endpoint before approval) are not configuration or dependency failures: no code, mapping or status is approved or implied for them, `DEPENDENCY_UNAVAILABLE` is not claimed to apply, and their pre-approval response is BLOCKED until LA-1(b) is decided.

### 4.1 Lead approvals pending (error codes and failure scope)
| ID | Decision needed from the lead | Until then |
|---|---|---|
| LA-1 | **(a)** Genuine missing or invalid configuration, or a dependency failure of ours: approve `FEATURE_NOT_CONFIGURED` as the final code, **or** confirm `DEPENDENCY_UNAVAILABLE` as the permanent code. The interim reading rests on the approved T2 text, which assigns 503 to 'our DB/config'; it also covers the Admin 2FA failure scope (`MASTER_ARCHITECTURE.md` §8.2). **(b)** Features waiting on an unresolved business decision (currently the B1 recalculation endpoint before approval): decide a code or an interim mapping. None exists, and `DEPENDENCY_UNAVAILABLE` is not claimed to apply. | (a) Interim: 503 `DEPENDENCY_UNAVAILABLE`, generic message, via one helper in `lib/http`. (b) **BLOCKED:** the pre-approval response is not implemented or released; no code is invented or reused. |
| LA-2 | Approve `EMAIL_ALREADY_REGISTERED`, **or** keep `CONFLICT` with `fields.email`, **or** choose a non-revealing registration response (which changes registration behavior and may need email delivery). Tied to B3. | Interim: 409 `CONFLICT` with `fields.email`; reveals that the email exists, as the prototype does. |
| LA-3 | For each of `REGISTRATION_CLOSED`, `INVALID_CREDENTIALS`, `TWO_FACTOR_INVALID`, `CSRF_REJECTED`, `UNSUPPORTED_MEDIA_TYPE`: record **either** approval of the code **or** an approved interim mapping to an already approved code. Do this before the corresponding response contract is implemented. | **BLOCKED.** The response contract of each is not implemented or released. Intended refusal and HTTP status are preserved (403, 401, 401, 403, 415 respectively) but are not a response contract. No placeholder code, no reuse of another code. |
| LA-4 | Confirm the default failure scope for variables not listed in `MASTER_ARCHITECTURE.md` §8.2 (feature-scoped; Core when shared or security/data-integrity related). | The default as written. |
| LA-5 | Confirm that a missing or invalid `RESTRICTED_CONTACT_EMAIL` in production omits only the contact element of `/restricted` (with a neutral message) instead of refusing the page. | As written in §8.2; logged on every process start. |

## 5. Business decisions B1–B21
`Seam` = what implementers build while the rule is undecided.

| ID | Topic | Status | v1 direction / seam |
|---|---|---|---|
| B1 | Rating formula | OPEN | `computeRating(inputs, config)` with `formulaVersion`. No formula in code. No rating shown unless stored; new users show the prototype's "not rated" state. Until B1 is approved, the recalculation endpoint's pre-approval response contract is BLOCKED (`MASTER_ARCHITECTURE.md` §6.4, LA-1(b)) and the endpoint is not released. This is not a configuration failure, and neither `DEPENDENCY_UNAVAILABLE` nor the PENDING `FEATURE_NOT_CONFIGURED` is used for it. |
| B2 | Restriction policy | OPEN | Thresholds come from config and are unset by default, so nothing restricts automatically. Admin restrict/reopen endpoints exist, authorized and audited. Statuses are `active` and `restricted` only; no `disabled`. The prototype has no Restrict button; adding one needs lead approval. |
| B3 | Registration and identity | OPEN | Eligibility sits behind `REGISTRATION_MODE` (`closed` default in production, `open` only if set). No allowlist or invite model. First admin comes from the seed script and env only; no promotion endpoint. Interim for a duplicate email: HTTP 409 `CONFLICT` with `fields.email` (approved code, approved meaning), which reveals that the email is registered, as the prototype does. `EMAIL_ALREADY_REGISTERED` is PENDING and not used. Whether to keep revealing is the open account-enumeration trade-off (LA-2); it is not decided here. The closed-registration refusal has no approved code, so its response contract is BLOCKED (LA-3). |
| B4 | Attendance | OPEN (partly V1) | Built: configurable expiry (PROPOSED default 600 s), configurable max attempts (PROPOSED 5), lockout duration (PROPOSED dev default 900 s), one open session per lecture, brute-force protection. Not built: attendance percentage, denominator, corrections. DTOs return `percentage: null` and the UI shows counts only. |
| B5 | Streak | OPEN | ActivityEvents recorded. Qualifying types come from config, unset by default; the streak endpoint returns `enabled:false` and streak surfaces stay hidden. No link to rating. |
| B6 | Admin 2FA | OPEN | Enrollment and login-challenge endpoints specified behind `ADMIN_2FA_ENABLED` (default false). Not mandatory. No disable, recovery codes or reset until approved; do not enable in production before the recovery procedure is approved. If enabled with a missing or invalid `TWOFA_ENCRYPTION_KEY`, enrollment and verification are refused with the interim configuration refusal, a session awaiting 2FA stays awaiting 2FA, and 2FA is never bypassed or marked verified (`MASTER_ARCHITECTURE.md` §8.2). |
| B7 | LeetCode | V1-DIRECTION | Handles stored; LeetCode problems tracked; verify returns `unavailable`; no verified progress awarded. |
| B8 | Codeforces ownership | OPEN | The check looks for an accepted submission on the stored handle. Ownership of the handle is **not** proven, and the rule for earlier solves is undecided. Eligibility lives only in `isSolveEligible()`. Its TEMPORARY default accepts any accepted submission and records the submission time. This is a provisional solve check, not completed solve verification and not ownership proof. UI copy and docs must not call it "verified identity". |
| B9 | Contest results | V1-DIRECTION | Fetch → review → publish. Manual import deferred. Re-fetch is an idempotent upsert before publish; published results are not editable through the API in v1. |
| B10 | Scoring/leaderboard | OPEN | Store source-provided rank, points and penalty as fetched; show source rank. No cross-contest leaderboard. Published results stay visible to authenticated active students, as in the prototype. |
| B11 | Invitations | V1-DIRECTION | Active students see the link of published contests. No invitation model. |
| B12 | Lecture lifecycle | OPEN | One `deriveLectureState()` function; no duration field; no start/end-live endpoints. The join link shows for published lectures that have one (TEMPORARY). |
| B13 | Resources | V1-DIRECTION | URL-based; types `pdf`, `link`, `file` (a label for a downloadable URL). Validation: https only in production, max length, no embedded credentials, no `javascript:`/`data:`. No uploads. |
| B14 | Admin permissions | OPEN | Single `admin` role in v1, enforced through the explicit server-side permission map (T20; catalog in `MASTER_ARCHITECTURE.md` §7). Admins are not mapped to student permissions; whether they may open student pages, whether permissions become granular, and who may restrict, reopen, publish or read audit logs remain OPEN. |
| B15 | Notifications | V1-DIRECTION | In-app only. Triggers: announcement published, contest published, attendance recorded. Time-based reminders wait on B21. No unread badge (none in the prototype). |
| B16 | Retention/deletion | OPEN | No account-deletion endpoint, no purge jobs. TTL only on sessions, rate-limit rows and expired challenges. Seed data uses synthetic placeholders, not the prototype's real-looking names. |
| B17 | Time zone | PROPOSED | `CAMPUS_TIMEZONE=Africa/Addis_Ababa`, subject to NCC confirmation. Store UTC. |
| B18 | Problem semantics | OPEN | `value` stored as an optional number with no calculation attached; progress is raw solved/total counts per topic; one topic per problem. |
| B19 | Email flows | V1-DIRECTION | Forgot/reset password and email verification deferred. v1 has no account-recovery path. **LAUNCH BLOCKER** (see §8). |
| B20 | UI controls | V1-DIRECTION | No control ships without a working handler. Announcements/Lectures Filter buttons are removed unless the owner implements the documented query filters. `/results` opens the latest published contest. The restricted-page contact address comes from `RESTRICTED_CONTACT_EMAIL`, not hard-coded. If it is missing or invalid in production, only the contact element of `/restricted` is omitted (page, enforcement and other features unaffected) and the failure is logged (`MASTER_ARCHITECTURE.md` §8.2, LA-5). The admin 2FA chip is hidden while `ADMIN_2FA_ENABLED` is false. Theme-toggle placement: A2 proposes, lead approves. |
| B21 | Hosting/scheduler | OPEN | No scheduled jobs. Recalculation is admin-triggered only, and blocked by B1. Production bcrypt cost, cookie domain and cron wiring wait for the host. |

## 6. Unresolved approvals required from NCC
| ID | Approval needed |
|---|---|
| B1 | Formula, weights, mapping of each component to 1–5, rounding, initial rating, recalculation schedule |
| B2 | Warning and restriction thresholds, automatic vs manual, what is blocked, behavior after reopening |
| B3 | Who may register, identity fields and verifier, how admins are created or promoted |
| B4 | Percentage denominator, treatment of deleted lectures, correction policy, final expiry/attempt/lockout values |
| B5 | Qualifying actions, day boundary, effect of a missed day, any link to rating |
| B6 | Mandatory or optional, recovery codes, lost-device procedure, who resets |
| B8 | Ownership-proof method, rule for solves made before a problem was added |
| B10 | Official scoring, tie-breaking, cross-contest leaderboard, participant visibility |
| B12 | Live/completed rules, whether a duration exists, when the join link is visible |
| B14 | Equal or granular admin permissions; who may restrict, reopen, publish, read audit logs |
| B16 | Retention periods, account deletion, seed-data rules |
| B17 | Confirm the campus time zone |
| B18 | Meaning of problem `value`, progress calculation |
| B21 | Host, scheduler, production environment |
| B4, B9, B15, B19 | Confirm the PROPOSED/V1 defaults, and the v1 account-recovery gap (B19) |

## 7. Decision process
Each decision records: question and options, selected option and rationale, owner and date, affected documents/endpoints/models, and migration impact. Until resolved, use the seam or report a blocker. Never silently choose a business policy.

## 8. Launch blockers
Release must not proceed while any of these is unresolved. `IMPLEMENTATION_PLAN.md` Gate 7 must list each one (carried forward in batch G).

| ID | Blocker | Needed to clear |
|---|---|---|
| LB-1 | **B19 account recovery.** v1 has no forgot-password, reset or admin-assisted recovery. A student or admin who loses a password has no recovery path. | Account recovery is implemented and tested, or NCC explicitly accepts launching without it. |
| LB-2 | **B6 recovery procedure** if admin 2FA is enabled in production. | NCC approves recovery codes or a reset procedure before `ADMIN_2FA_ENABLED=true`. |
| LB-3 | **B3 registration policy.** Production registration stays `closed` by default. | NCC approves who may register and how. |
| LB-4 | **B21 production host** and bcrypt-cost benchmark (T19). | Host chosen; cost measured there and recorded. |

**LB-1 launch condition (reproduce verbatim in Gate 7 and the release checklist):** *Release is blocked until account recovery is implemented and tested, or NCC explicitly accepts launching without it.* The choice of recovery path is not decided here; this sentence is the whole condition, and no document may weaken it.

## 9. Carry-forward to later batches
Corrections accepted in batch B that land in documents not yet revised. Each must appear in its target before that batch is submitted.

| Item | Target |
|---|---|
| Per-endpoint error codes drawn only from the §6.4 registry. A PENDING code may appear only as a marked proposal until the lead confirms it, and the five BLOCKED response contracts stay marked BLOCKED until LA-3 is decided | `API_CONTRACT.md` (batch E) |
| Encryption contexts per purpose (§8.3) used consistently; rotation and any previous-key rule for `TWOFA_ENCRYPTION_KEY` | `DATABASE_SCHEMA.md` (C), `AUTH_AND_SECURITY.md` (D) |
| Every endpoint row shows exactly one catalogued permission or one `PUBLIC_ROUTES` entry (`MASTER_ARCHITECTURE.md` §7); the route-coverage check of §7.4 listed as required work | `API_CONTRACT.md` (E), `AUTH_AND_SECURITY.md` (D) |
| Role-change detection and revocation procedure, in full | `AUTH_AND_SECURITY.md` (batch D) |
| Encryption-key handling in the attendance flow; session field list | `DATABASE_SCHEMA.md` (C), `AUTH_AND_SECURITY.md` (D) |
| Permission matrix using exactly the §7 catalog | `API_CONTRACT.md` (E) |
| `isSolveEligible()` signature and the "provisional solve check" wording | `SERVICES.md` (F), `API_CONTRACT.md` (E) |
| Release checklist item: `RESTRICTED_CONTACT_EMAIL` set and valid in production (a missing value is a defect to fix before launch, not an accepted state) | `IMPLEMENTATION_PLAN.md` (G) |
| Launch blockers LB-1 to LB-4 in Gate 7 and the release checklist, with the LB-1 sentence above reproduced verbatim in the Gate 7 exit criteria | `IMPLEMENTATION_PLAN.md` (G) |
