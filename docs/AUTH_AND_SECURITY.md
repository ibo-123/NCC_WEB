# Authentication and Security Contract

**Contract revision:** Phase 3, batch 1 (draft for lead review). Owner: A4. Subordinate to `DECISIONS.md` and `MASTER_ARCHITECTURE.md` (frozen). Field names follow `DATABASE_SCHEMA.md` revision 3, whose formal approval is still pending. Status words (`APPROVED`, `V1-DIRECTION`, `PROPOSED`, `OPEN`, `PENDING`, `BLOCKED`, `UNVERIFIED`) are defined in `DECISIONS.md` §1. Where this file and a frozen document differ, the frozen document wins; report the difference.

Nothing here claims a build, test or index check has run. None has. A value marked **PROPOSED** is an engineering default that is **not approved**; the ones that are security-critical are listed in §12 for lead approval and must not be treated as frozen.

## 1. Sessions
Server-side opaque sessions (`DECISIONS.md` §3). Authentication helpers live only in `lib/auth/*`; route handlers never parse sessions themselves.

- **Token.** A cryptographically secure random token (`crypto.randomBytes`, at least 32 bytes), sent only in the cookie. Only its HMAC is stored: `Session.tokenHash` = HMAC-SHA-256 of the token keyed with `SESSION_SECRET` (T19).
- **Cookie (T18).** Path `/`, `HttpOnly`, `SameSite=Lax`, `Secure` in production, `Max-Age` equal to the remaining lifetime. The cookie name is chosen by A4 and recorded here when fixed. The earlier draft's "narrow path" is superseded: page guards need the cookie on every page and on `/api`.
- **Session record.** Fields as in `DATABASE_SCHEMA.md` §4.2: `userId`, `tokenHash`, `expiresAt`, `lastUsedAt`, `revokedAt`, `userAgent` (short summary, no IP), `twoFactorVerified`, `reauthAt`. Role and status are **not** stored in the session.
- **Every protected request** (`MASTER_ARCHITECTURE.md` §5): hash the cookie token, find a session that is not revoked and not expired, load the user from the database, and take `role` and `status` from that user. Never trust a role, permission or user id sent by the browser. `lastUsedAt` is updated at most once per minute (PROPOSED).
- **Lifetime — PROPOSED, security-critical (S-1).** Absolute lifetime: 7 days for `student`, 12 hours for `admin`; no sliding extension. Kept as constants in `lib/auth`, not environment variables, because `MASTER_ARCHITECTURE.md` §8.1 defines none.
- **Rotation.** Login always creates a new session; a pre-login cookie is never reused. Completing 2FA issues a new session and revokes the pending one (PROPOSED).
- **Revocation (T17).** Sessions are revoked on logout, expiry, admin 2FA reset, role change and account deletion. They are **not** revoked when an account is restricted or reopened; the per-request status check enforces both.
- **Role changes.** A role change made through a service updates the user, revokes all of that user's sessions (`revokedAt`) and writes the `AuditLog` row in one transaction. A manual database edit is still enforced on the next request, because role is read from the database each time, but it does **not** revoke sessions. After any manual role or status edit, an operator revokes the user's sessions by a maintenance operation owned by A3; that operation's existence is PROPOSED. v1 has no role-promotion endpoint (B3).
- **Errors.** No valid session → `UNAUTHENTICATED`. Expired or revoked sessions are treated the same way.

## 2. Passwords
- `bcryptjs`. **Cost is not final (T19, LB-4):** read from `BCRYPT_COST` (interim 12, **UNVERIFIED**); it must be benchmarked on the deployment host before being fixed, and that depends on B21.
- Length is validated in bytes (`Buffer.byteLength`), minimum 8 (prototype), maximum 72, identically on client and server (T19). No other composition rule is invented. No breached-password check is proposed.
- Passwords and hashes never appear in logs, audit rows or responses.
- **Not in v1 (T10, B19):** forgot-password, reset, change-password, email verification. There is no account-recovery path (**LB-1**, §11). A password change or recovery flow, when approved, must revoke the user's other sessions; that rule is recorded here for later, not built now.

## 3. Registration (B3 OPEN)
- Route `POST /api/auth/register` is public (`MASTER_ARCHITECTURE.md` §7.1). Eligibility sits behind `REGISTRATION_MODE`: an absent or invalid value is treated as `closed`; `open` only if explicitly set (`MASTER_ARCHITECTURE.md` §8.1–§8.2). No allowlist, invite or promotion model exists.
- **Closed registration:** the request is not processed, intended HTTP 403. The response contract is **BLOCKED** (LA-3).
- **Duplicate email — interim (LA-2):** HTTP 409 `CONFLICT` with `fields.email`. This reveals that the email is registered, as the prototype does. Whether to keep it is the open enumeration trade-off; it is not decided here. `EMAIL_ALREADY_REGISTERED` is PENDING and not used. A concurrent duplicate caught by the unique index returns the same response.
- Registration is rate-limited (§7). The first admin comes from the seed script and `SEED_ADMIN_*` only (B3, A3). Whether registration creates a session is specified in `API_CONTRACT.md` from the prototype, not decided here.

## 4. Login
- `POST /api/auth/login` is public and rate-limited. A restricted user can log in and is then limited by §6.
- **Failure:** unknown email and wrong password must produce an **identical** response and no session; intended HTTP 401. The response contract is **BLOCKED** (LA-3). To avoid a timing difference, run a bcrypt comparison against a fixed dummy hash when the email is unknown (PROPOSED).
- **Success:** create a session (§1). Set `twoFactorVerified` explicitly: `false` only when `ADMIN_2FA_ENABLED` is on, the user is an `admin`, and `twoFactor.enabled` is true; otherwise `true`. Update `lastLoginAt`.

## 5. Authorization
The permission catalog, `PUBLIC_ROUTES`, deny-by-default rule and route-coverage rule are in `MASTER_ARCHITECTURE.md` §7 and are not restated. This file adds:

- **Public routes (v1):** register and login only. Every other route declares one catalogued permission.
- **Admin access to student-related data goes through `/admin/*` routes** with admin permissions (`users.read`, `progress.admin.read`, `attendance.admin.read`, `rating.admin.read`, and similar). Admins are not mapped to student permissions. Whether admins may open student pages is OPEN (B14).
- **Ownership checks (services):** a student reaches only their own profile, attendance history, notifications, progress and solve-check results. v1 has no notification mark-read endpoint; `notifications.read` is read-only and owner-filtered.
- **Mass assignment:** profile and handle updates use explicit field allowlists. Roles, status, rating, 2FA state and ownership fields are never client-writable.
- **Single admin role in v1;** granular permissions, and who may restrict, reopen, publish or read audit logs, stay OPEN (B14). Handlers never check role directly; they declare a permission.

Auth routes in v1 (full request and response schemas are in `API_CONTRACT.md`):

| Route | Access |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | public |
| `POST /api/auth/logout` | `auth.logout` |
| `GET /api/auth/me` | `auth.me` |
| `PUT /api/users/me/handles` | `profile.handles.update` |
| `POST /api/auth/2fa/verify` | `auth.2fa.verify` (state-gated, §8) |
| `POST /api/admin/security/2fa/setup`, `POST /api/admin/security/2fa/confirm` | `twofa.enroll` |

## 6. Account restriction (B2 OPEN)
- **Enforcement (T17).** On every request, load `User.status`. A restricted user may use only login (public), `auth.me` and `auth.logout`; every other API request returns `ACCOUNT_RESTRICTED` (403). Page access is separate: server layouts redirect a restricted user to `/restricted`, which, with the login page and static assets, stays reachable and grants no API permission. Edge middleware checks cookie presence only.
- `GET /api/auth/me` returns status and the rating snapshot for `/restricted`. The contact address comes from `RESTRICTED_CONTACT_EMAIL`; if it is missing or invalid, only the contact element is omitted (`MASTER_ARCHITECTURE.md` §8.2, LA-5 pending).
- **Restrict and reopen** are admin actions (`users.restrict`, `users.reopen`): the user update and its `AuditLog` row are written in one transaction. Reopening needs no new session. There is no `disabled` status.
- **Open policy (B2):** thresholds, automatic enforcement, what else is blocked, and behavior after reopening. Thresholds are unset by default, so nothing restricts automatically. The prototype has no Restrict button; adding one needs lead approval.

## 7. Rate limiting (T5, T23)
Mongo-backed, atomic, using the `RateLimit` collection (`DATABASE_SCHEMA.md` §4.16). Exceeding a limit returns `RATE_LIMITED` (429) with `retryAfterSeconds`. In-memory limiting is not allowed.

- **Key hashing — PROPOSED, security-relevant (S-2).** `RateLimit.key` = `<scope>:` + hex HMAC-SHA-256 of the subject (normalized email, IP, or session plus user), keyed by `SESSION_SECRET` with a fixed domain label so the output is never usable as a session hash. Raw emails and IPs are not stored. Reusing `SESSION_SECRET` is a new use of that key; a separate key would need a new variable in `MASTER_ARCHITECTURE.md` §8.1, which is frozen.
- **Variables.** Names follow `RATE_LIMIT_<SCOPE>_MAX` and `RATE_LIMIT_<SCOPE>_WINDOW_SECONDS` (plus `_LOCKOUT_SECONDS` where a lockout applies). Defaults apply only when a variable is absent. A present but invalid value is a validation failure, and because these affect authentication, the default failure scope is Core (`MASTER_ARCHITECTURE.md` §8.2, LA-4 pending).
- **Attendance** already has variables in `MASTER_ARCHITECTURE.md` §8.1 and is not renamed.

| Scope | Counted subject | PROPOSED default | Notes |
|---|---|---|---|
| `LOGIN` | email + IP | 5 failures / 900 s, then lockout 900 s | security-critical (S-3) |
| `LOGIN_IP` | IP | 30 failures / 900 s | campus NAT risk (S-3) |
| `REGISTER` | IP | 5 / 3600 s | |
| `ATTENDANCE` (B4) | session + student | 5 failures, lockout 900 s | the three values are B4 PROPOSED, configurable |
| `ATTENDANCE_SESSION` (T5) | session | 300 failed attempts in total | security-critical (S-4) |
| `ATTENDANCE_IP` (T5) | IP | **not fixed.** 60 failures / 900 s is too low for a shared campus IP; 300 / 900 s is proposed (assessment below) | campus NAT (S-4) |
| `TWOFA_VERIFY` | pending session | 5 failures / 900 s, then the session must log in again | security-critical (S-5) |
| `SOLVE_CHECK` | user | 10 / 3600 s | protects the upstream API |

**S-4 shared-IP assessment (illustrative arithmetic, not measured).** The prototype's sample admin dashboard shows 128 students. If one room shares one NAT address, 128 students who each mistype the code once produce 128 failures, which exceeds a 60-per-IP limit and would lock the whole class out; at an average of two mistypes each it is 256, still below 300. The per-student limit (5) and the session cap (300) already bound guessing: 300 failed guesses against 10,000 codes is at most about 3% for any group of attackers. So a per-IP limit adds little inside one room and mostly risks locking out honest students. Proposed: keep the 300-attempt session cap, and set the per-IP attendance limit to 300 failures per 900 s so it never binds a single room first. The real campus network (NAT or not) is unknown, so this is **UNVERIFIED**; observe the failure counts in a pilot before fixing it. The same shared-IP risk applies to `LOGIN_IP` (30 / 900 s), which is provisionally approved and under the same security review.

Attendance codes have only 10,000 values, so every failed attempt counts across students. A session-wide cap trades brute-force resistance against a student locking everyone out; the value is yours to set. A code shared by someone inside the room cannot be prevented technically.

## 8. Admin two-factor authentication (B6 OPEN)
Behind `ADMIN_2FA_ENABLED` (default `false`). **Not mandatory.** Production must not enable it until NCC approves a recovery procedure (**LB-2**).

- **Enrollment.** `POST /api/admin/security/2fa/setup` generates a secret and returns the setup data once. It requires recent re-authentication: the request carries the admin's current password, which sets `reauthAt`; a value more than 10 minutes old (PROPOSED) is not recent. The secret is stored encrypted with `enabled: false`. `confirm` takes a code, then sets `enabled: true` and `enabledAt`. Neither response returns a stored secret again.
- **Login challenge.** A session with `twoFactorVerified: false` may use only `auth.2fa.verify` and `auth.logout`; every other route returns `UNAUTHENTICATED`. `auth.2fa.verify` is a catalogued, state-gated admin permission, not a public route. Success issues a new session with `twoFactorVerified: true` and revokes the pending one (PROPOSED). A wrong or expired code keeps the session pending, and its response contract is **BLOCKED** (LA-3, intended HTTP 401). Failures are limited by `TWOFA_VERIFY`.
- **TOTP parameters — PROPOSED:** SHA-1, 6 digits, 30-second period (the common authenticator default and the prototype's six boxes) and a tolerance of one step either way. Library: `otpauth` (PROPOSED, `MASTER_ARCHITECTURE.md` §3.4). **TOTP replay is prevented (lead decision on S-6).** After a code is accepted, the user's last accepted time step (`twoFactor.lastUsedStep`) is recorded, and a later code is accepted only if its matched time step is greater. The check and the update are one atomic conditional write, so two concurrent submissions of the same code cannot both succeed. Enrollment confirmation records its step too. A rejected replay uses the same wrong-code response, which is **BLOCKED** (LA-3). **The `twoFactor.lastUsedStep` field is a proposed schema change** (`DATABASE_SCHEMA.md` §4.1), to be coordinated with A3 before A4 implements 2FA.
- **Encryption.** `twoFactor.secretEnc` uses the `admin-2fa-secret` purpose label with the administrator's `User._id`, and only `TWOFA_ENCRYPTION_KEY`; no other key is ever tried, and a context mismatch or authentication failure fails safe (`MASTER_ARCHITECTURE.md` §8.3, `DATABASE_SCHEMA.md` §5.2).
- **Configuration failure.** If `ADMIN_2FA_ENABLED=true` and `TWOFA_ENCRYPTION_KEY` is missing or invalid, enrollment and verification are refused with the interim configuration refusal, an enrolled admin stays awaiting 2FA, and 2FA is never bypassed or marked verified (`MASTER_ARCHITECTURE.md` §8.2).
- **Key rotation — deferred item, PROPOSED procedure (S-7).** `MASTER_ARCHITECTURE.md` defines no previous-key variable for `TWOFA_ENCRYPTION_KEY`, and adding one would change frozen §8.1. Proposed procedure: an offline re-encryption script owned by A3 reads the old and new keys from its own inputs (not from application variables), re-encrypts every enrolled secret in a maintenance window, then the new key is deployed. Until approved, `TWOFA_ENCRYPTION_KEY` is the only 2FA key. The routine rotation interval is an operations matter tied to B21.
- **Not in v1:** disable, recovery codes, reset. Recovery codes, if ever added, must be random, shown once, stored hashed and rate-limited.

## 9. Attendance codes (T4, T5, T6; B4 OPEN)
Encryption, key selection, matching context and fail-safe behavior are in `MASTER_ARCHITECTURE.md` §8.3 and `DATABASE_SCHEMA.md` §5.1.
- **Flow.** Check-in is lecture-based. The server resolves the open session, compares the submitted code in constant time after decrypting, and checks attempt limits (§7). Duplicate check-ins are rejected by the unique index.
- **Responses (approved codes):** wrong code `ATTENDANCE_INVALID_CODE` (400); expired `ATTENDANCE_EXPIRED`, none open `ATTENDANCE_NOT_ACTIVE`, already checked in `ATTENDANCE_DUPLICATE` (409); locked out `RATE_LIMITED` (429).
- **Expired sessions (lead decision A1).** An expired session is closed lazily in one transaction: `closedAt` is set to the server time and `codeEnc` is cleared. Triggers: a check-in on the expired session, or an admin starting the next session for that lecture. The close commits even though the check-in response is `ATTENDANCE_EXPIRED`. Cleanup happens on access, not at the moment of expiry. Whether system closures are audit-logged is **unsettled** (T24 covers admin mutations only).
- Codes are generated with `crypto.randomInt`, shown only to admins, and never appear in logs, audit rows or student responses.
- **No admin corrections in v1 (B4).** Expiry, attempt and lockout values are PROPOSED and configurable (§7).

## 10. Validation, CSRF, audit, integrations, configuration

**Validation and database safety.** Zod validates params, query and body; unknown input is stripped (`MASTER_ARCHITECTURE.md` §5). Validate ObjectIds before queries. Updates use explicit allowlists, never a spread of the request body. Never pass untrusted objects as MongoDB filters. Duplicate-key and validation errors go through the shared error contract. Multi-document writes use transactions, which need a replica set.

**CSRF (T18).** Every mutating request is checked: the `Origin` must match the origin of `APP_URL`, and the body must be JSON. GET requests never change state. A missing `Origin` on a mutating request is rejected (PROPOSED; the test harness sets `Origin`). The refusal responses are **BLOCKED** (LA-3): `CSRF_REJECTED` (403) and `UNSUPPORTED_MEDIA_TYPE` (415) are PENDING and must not be used.

**Audit logging (T24).** Every admin mutation writes an `AuditLog` row with actor, action, entity, safe summary and `correlationId`, using the `domain.verb` registry, which does not yet exist. v1 admin mutations include restrict, reopen, publish and delete of announcements, lectures, contests and results, topic and problem changes, attendance start and close, and 2FA enrollment. Never log credentials, tokens, TOTP secrets, encryption keys or attendance codes. The earlier draft's role changes, attendance corrections, result imports and rating adjustments have no v1 route (B3, B4, B9, B1) and are not listed.

**External integrations.** The Codeforces client is owned by A6. Apply timeouts and bounded retries (PROPOSED: 10 s, at most one retry; A6 records the final values in `SERVICES.md`). An upstream failure returns `UPSTREAM_ERROR` (502); `DEPENDENCY_UNAVAILABLE` is for our own dependencies. LeetCode is represented honestly: handles are stored, the check returns `unavailable`, no progress is awarded (B7). The Codeforces check is a **provisional solve check**: it finds an accepted submission on the stored handle, does not prove handle ownership, and is not completed verification (B8). It must not be called verified identity. Eligibility lives only in `isSolveEligible()`. Never scrape, never store external passwords.

**Configuration and deployment.** Secrets live only in environment or secret management and are never committed; `.env*` stays out of Git except `.env.example` (placeholders only). Required variables, failure scopes and startup or readiness behavior are in `MASTER_ARCHITECTURE.md` §8. Production errors never reveal stack traces or database details. HTTPS in production. A backup, restore and index-change procedure is required before production use and depends on B21 (**LB-4**).

## 11. Not decided here, and what is blocked
| Item | Status | Consequence |
|---|---|---|
| LA-1 final configuration-failure code; business-blocked features | OPEN | Interim 503 `DEPENDENCY_UNAVAILABLE` for configuration or dependency failures; business-blocked responses BLOCKED |
| LA-2 duplicate-email response | OPEN | Interim 409 `CONFLICT`; reveals the email |
| LA-3 five codes | OPEN | Responses for closed registration, login failure, wrong 2FA code, CSRF failure and non-JSON body are BLOCKED |
| LA-4, LA-5 | OPEN | Failure-scope defaults as written |
| B2, B3, B6, B14 | OPEN | Seams only (§3, §6, §8, §5) |
| **LB-1** | Release blocker | Release is blocked until account recovery is implemented and tested, or NCC explicitly accepts launching without it. |
| LB-2, LB-3, LB-4 | Release blockers | Admin 2FA recovery, registration policy, host and bcrypt cost |
| Audit logging of lazy attendance closures | Unsettled | T24 covers admin mutations only |

## 12. Values awaiting lead approval (PROPOSED, not frozen)
| ID | Value | Why it matters | Status |
|---|---|---|---|
| S-1 | Session lifetime: 7 days student, 12 hours admin, no sliding | Exposure window of a stolen cookie | PROVISIONALLY APPROVED, subject to security review |
| S-2 | `RateLimit.key` hashing with `SESSION_SECRET` and a domain label | Reuses a secret for a second purpose | PROVISIONALLY APPROVED, subject to security review |
| S-3 | Login limits (5 per 900 s per email + IP, 30 per 900 s per IP) | Lockout abuse and campus NAT | PROVISIONALLY APPROVED, subject to security review |
| S-4 | Attendance session cap (300) and per-IP limit (60) | Brute-forcing a 10,000-value code versus a student locking everyone out | Session cap 300 retained; per-IP threshold NOT fixed (assessment in §7) |
| S-5 | 2FA verification limit (5 per 900 s) | Online TOTP guessing | PROVISIONALLY APPROVED, subject to security review |
| S-6 | TOTP replay prevention by `twoFactor.lastUsedStep` | Prevents reuse of an accepted code | Replay prevention approved; schema change pending A3 coordination |
| S-7 | 2FA key rotation by offline re-encryption | A previous-key variable would change frozen §8.1 | PROVISIONALLY APPROVED, subject to security review |
| S-8 | 10-minute re-authentication window; absent `Origin` rejected; new session on 2FA success | Sensitive-action and CSRF behavior | PROVISIONALLY APPROVED, subject to security review |

Not security-critical, left to the owners: `REGISTER`, `SOLVE_CHECK`, `lastUsedAt` throttle, upstream timeout and retry.

## 13. Required security tests (A4)
Success, validation failure, unauthenticated, forbidden, restricted and 2FA-pending access for every route; the route-coverage check of `MASTER_ARCHITECTURE.md` §7.4; session expiry, revocation and role-change revocation; rate-limit atomicity; attendance brute force and duplicates; no secret in any response or log; encryption context mismatch and wrong-key failure. Report exactly which were run; none has been.
