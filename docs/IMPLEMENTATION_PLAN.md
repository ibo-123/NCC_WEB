# Implementation Plan

**Contract revision:** Phase 3, batch 3 (draft for lead review). Owner: A1. Subordinate to `DECISIONS.md` and `MASTER_ARCHITECTURE.md` (frozen). Ownership is in `TEAM_WORKFLOW.md`. **No gate below has been completed.** No install, lint, build, test, render or index check has been run; this plan records what is required, not what passed.

## Current status
| Item | State |
|---|---|
| Repository | `main` at `851c94f`. `app/` is still the create-next-app starter. No feature code. |
| `DECISIONS.md`, `MASTER_ARCHITECTURE.md` | Frozen |
| `DATABASE_SCHEMA.md` (rev 3) | Awaiting formal approval; indexes UNVERIFIED |
| `AUTH_AND_SECURITY.md` | Draft. S-1, S-2, S-3, S-5, S-7, S-8 provisionally approved subject to security review; S-4 per-IP threshold not fixed; S-6 replay prevention approved, schema change pending A3 |
| `API_CONTRACT.md` | Direction approved; BLOCKED items stay blocked |
| `SERVICES.md` | Draft; direction approved |
| Ownership | `middleware.js` A4, admin dashboard A5, admin audit-log A4 (confirmed) |
| Open lead decisions | LA-1 to LA-5; S-4 and S-6 completion; Node range, dependency and test-tool list; Batch C approval |

## Gate 0 — Baseline (A1, with A2)
- Inspect the repository, branch and working tree.
- Install dependencies, run lint and build, and record the baseline results and any failures.
- Render the prototype at 1440, 1280, 768 and 390 widths, in both themes, and record what differs.
- **Exit:** a baseline report from real command output. Status: **not started.**

## Gate 1 — Freeze contracts (A1)
- Approve `DATABASE_SCHEMA.md`, `AUTH_AND_SECURITY.md`, `API_CONTRACT.md` and `SERVICES.md`.
- Record the Node range and the approved dependency list (`MASTER_ARCHITECTURE.md` §3).
- Decide or explicitly defer LA-1 to LA-5 and the S-values. A deferred item stays behind its seam.
- **Exit:** each contract has an approved version recorded by A1. Status: **two of six contract documents are frozen** (`DECISIONS.md`, `MASTER_ARCHITECTURE.md`).

## Gate 2 — Foundation (A2 and A3 in parallel, disjoint files)
- A2: `lib/config`, `lib/http`, `lib/validation`, configs, CI, test setup, tokens, theme, shared components, shells.
- A3: connection helper, all models and indexes, seed script, schema tests on a replica set, audit, notify and activity helpers; publishes exports first.
- **A3 index verification:** validate every index against the actual MongoDB and Mongoose versions: the handle indexes, the topic-slug partial index, the open-session partial index, the TTL indexes on `Session` and `RateLimit`, the derived `RateLimit.key` and `Session {userId}` indexes, and all others. Record the result.
- **Exit:** foundation PRs merged; build and lint run and reported accurately; shared interfaces published.

## Gate 3 — Authentication and security (A4)
- Sessions, login, logout, `auth.me`, registration behind `REGISTRATION_MODE` (closed by default in production), permissions map and `PUBLIC_ROUTES`, restriction enforcement, rate limiting, CSRF check, handles, admin 2FA behind `ADMIN_2FA_ENABLED`, audit helper use.
- The route-coverage check of `MASTER_ARCHITECTURE.md` §7.4 is written and run.
- Responses for closed registration, login failure, wrong 2FA code, CSRF failure and non-JSON body stay **BLOCKED** until LA-3 is decided.
- **Exit:** security tests (`AUTH_AND_SECURITY.md` §13) run and reported.

## Gate 4 — Core learning (A5)
- Announcements, lectures and resources, attendance (start, check-in, close, lazy closure on an expired session, deletion refusal while a session is open), notifications (no mark-read), student dashboard, with admin screens.
- No attendance corrections and no attendance percentage (B4). The lecture `state` values wait on B12.
- **Exit:** student and admin flows tested end to end.

## Gate 5 — Competition and progress (A6)
- Topics, problems and progress (raw counts), the provisional solve check behind `isSolveEligible()`, contests with fetch, review and publish, results, rating history (stored rows only, no formula), streak (`enabled: false` until B5), Codeforces client with timeouts.
- No leaderboard, no manual result import, no LeetCode progress. `POST /api/admin/rating/recalculate` stays **BLOCKED** (B1, LA-1(b)).
- **Exit:** workflows tested; external API failure returns `UPSTREAM_ERROR`.

## Gate 6 — Admin and notifications
- Admin users, restrict and reopen (B2 policy OPEN), the admin dashboard and its `AuditLog` recent activity, the audit-log view.
- The admin notifications view stays **BLOCKED** until the `domain.verb` action registry exists; then it shows only the six approved categories, with no read state.
- Admin routes reuse domain services; no duplicated business logic.
- **Exit:** admin workflows use the same validated services and permissions.

## Gate 7 — Integration and release readiness (A1 signs off)
- Run the critical Playwright journeys, desktop and mobile, dark and light, then lint, tests and the production build, and report the real output.
- Verify the environment, indexes, backups and deployment instructions, and the A3 index results from Gate 2.
- **Release checklist:** `RESTRICTED_CONTACT_EMAIL` is set and valid in production. A missing value is a defect to fix before launch.
- **Launch blockers**, all required to be cleared or explicitly accepted:

| ID | Blocker | Needed to clear |
|---|---|---|
| LB-1 | No account recovery (B19) | Account recovery is implemented and tested, or NCC explicitly accepts launching without it |
| LB-2 | Admin 2FA recovery procedure (B6) | NCC approves recovery codes or a reset procedure before `ADMIN_2FA_ENABLED=true` |
| LB-3 | Registration policy (B3) | NCC approves who may register and how |
| LB-4 | Production host and bcrypt cost (B21, T19) | Host chosen; cost measured there and recorded |

**LB-1 launch condition (verbatim):** *Release is blocked until account recovery is implemented and tested, or NCC explicitly accepts launching without it.*

## Critical journeys
1. Registration (when the policy is open) → login → `auth.me` → logout.
2. Repeated login failures are rate-limited with no account enumeration beyond the documented interim registration response.
3. A student cannot reach admin endpoints; an admin has no student permissions.
4. A student browses published lectures and progress.
5. Attendance check-in succeeds; a duplicate, a wrong code and brute force are rejected; an expired session is closed on access.
6. An admin cannot delete a lecture while a session has `closedAt: null`.
7. An admin creates a contest, fetches results, reviews them and publishes them.
8. Rating and streak show stored values only; no leaderboard exists.
9. Restriction and reopening are authorized and audited, and a restricted student sees only `/restricted`.
10. Admin 2FA enrollment and challenge, with `ADMIN_2FA_ENABLED=true` in a test environment only.
11. A student reads only their own notifications.
12. Behavior with an expired session and an unavailable external API.
