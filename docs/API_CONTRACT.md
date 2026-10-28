# API Contract

**Contract revision:** Phase 3, batch 2 (draft for lead review). Owner of this document: A1. Subordinate to `DECISIONS.md` and `MASTER_ARCHITECTURE.md` (frozen); field names follow `DATABASE_SCHEMA.md` revision 3 (formal approval pending); security rules are in `AUTH_AND_SECURITY.md` (batch 1, values marked PROPOSED are not approved). Where this file differs from a frozen document, the frozen document wins; report the difference.

Nothing here claims a route was built, run or tested. None was. The inventory starts from the audit's endpoint list (T11) and removes or holds what the frozen decisions remove or hold. **Every route below has exactly one catalogued permission (`MASTER_ARCHITECTURE.md` §7.3) or one `PUBLIC_ROUTES` entry (§7.1).** Anything that depends on an unresolved decision is marked **BLOCKED** and must not be built or released.

## 1. Conventions
- **Root:** `/api`. JSON in and out. IDs are strings; timestamps are ISO-8601 UTC strings. Identity and role come only from the server session, never from a request body.
- **Envelope and pagination (T1, `MASTER_ARCHITECTURE.md` §6.2–§6.3).** Success `{ "success": true, "data": … }`. Lists: `data = { items, pagination: { page, limit, total, totalPages } }`, query `page` (default 1) and `limit` (default 20, max 50). Failure `{ "success": false, "error": { code, message, fields?, retryAfterSeconds? } }`.
- **Errors.** Codes come only from the registry in `MASTER_ARCHITECTURE.md` §6.4; this file defines none. The five codes with BLOCKED response contracts (`REGISTRATION_CLOSED`, `INVALID_CREDENTIALS`, `TWO_FACTOR_INVALID`, `CSRF_REJECTED`, `UNSUPPORTED_MEDIA_TYPE`) are never written into a route's response; the affected responses are marked BLOCKED (LA-3). Configuration or dependency failures use the interim 503 `DEPENDENCY_UNAVAILABLE` (LA-1(a) pending).
- **Every route** can also return `UNAUTHENTICATED`, `FORBIDDEN`, `ACCOUNT_RESTRICTED`, `VALIDATION_ERROR` (400, never 422), `RATE_LIMITED` (429), `INTERNAL_ERROR` and `DEPENDENCY_UNAVAILABLE`. The tables list only route-specific codes.
- **Validation.** Zod on params, query and body; unknown input is stripped. Text length bounds are not defined by any source: the owning account sets them in its schema and records them in `SERVICES.md`.
- **Status codes.** 200 reads, updates and actions; 201 creation; no 204. DELETE returns 200 with `data: { id }`.
- **Soft deletion (T9).** Deleted records return `NOT_FOUND` and never appear in lists. Topic deletion with non-deleted problems is 409 `INVALID_STATE`.
- **Mutating requests** need an `Origin` matching `APP_URL` and a JSON body (`AUTH_AND_SECURITY.md` §10). The refusal responses are BLOCKED (LA-3).
- **Admin access to student-related data uses `/admin/*` routes** (lead decision LD-5). Admins hold no student permissions; whether they may use student pages is OPEN (B14).
- **Audit.** Every admin mutation writes an `AuditLog` row (T24). The `domain.verb` action strings are assigned when the registry exists.

## 2. Shared shapes
`Id`, `Iso` are strings. `T|null` means nullable.

- **UserSelf:** `{ id, name, email, role, status, rating: number|null, handles: { codeforces: string|null, leetcode: string|null }, twoFactorEnabled?: boolean }` (`twoFactorEnabled` for admins only).
- **Handle fields:** trimmed; empty or whitespace-only is stored as missing. Format patterns are not defined (`DATABASE_SCHEMA.md` §8); A4 records them.
- **Announcement:** `{ id, title, body, type, publishedAt }`, `type` in `general, important, contest, lecture, attendance`.
- **Notification:** `{ id, type, title, body, href: string|null, createdAt }`. No read state in v1 (B15, LD-3).
- **Lecture:** `{ id, title, description, scheduledAt, liveUrl: string|null, resources: [{ title, type, url }], state, attendance: { sessionOpen, checkedIn } }`. `resources[].type` in `pdf, link, file`. `sessionOpen` is true only when the lecture's session has `closedAt` null and `expiresAt` in the future. `state` comes from `deriveLectureState()`; its values are **OPEN (B12)** and defined in `SERVICES.md` once decided. `liveUrl` is shown for published lectures that have one (B12 TEMPORARY).
- **Contest:** `{ id, title, description, platform: "codeforces", url, invitationUrl: string|null, startsAt, durationMinutes, status, resultsPublished, myResult: ContestResult|null }`, `status` derived: `upcoming, active, completed` (T8).
- **ContestResult:** `{ rank, points, penalty, handle, name, isMe }`: source-provided values as stored (B10, `DATABASE_SCHEMA.md` §4.10). No scoring policy is applied.
- **ProblemProgress:** `{ id, title, topicId, platform, url, value: number|null, status, solvedAt: Iso|null, lastCheckedAt: Iso|null }`, `status` in `unsolved, pending, solved, failed` (`unsolved` = no verification record). `value` has no calculation attached (B18). `solved` is a **provisional solve check**, not ownership proof (B8).
- **AttendanceSummary:** `{ attended: number, percentage: null }`. The percentage and its denominator are OPEN (B4).
- **RatingEntry:** `{ value, previous: number|null, change: number|null, source, components: { problem, contest, attendance }|null, computedAt, formulaVersion: string|null }`. No formula is defined (B1).
- **AdminUser:** `{ id, name, email, role, status, rating: number|null, restrictedAt: Iso|null, lastLoginAt: Iso|null, createdAt }`. **AdminUserDetail** adds `handles` and `restrictedReason`.
- **AuditEntry:** `{ id, action, entityType, entityId, summary, actor: { id, name }|null, createdAt }`. `meta` is never returned.
- **AdminAttendanceSession:** `{ id, lectureId, opensAt, expiresAt, closedAt: Iso|null, code: string|null }`. `code` is returned only to admins and only while `closedAt` is null; it never appears in lists, logs or student responses (T4).

## 3. Public and session routes
| Method and path | Permission | Request | Success | Route errors |
|---|---|---|---|---|
| POST `/api/auth/register` | public | `{ name, email, password, confirmPassword }`: name required; email valid, lowercased; password 8 characters minimum, 72 bytes maximum; `confirmPassword` equals `password` | 201 `{ user: UserSelf }`. **No session is created** (prototype: "Sign in to open your dashboard") | 409 `CONFLICT` with `fields.email` (interim, reveals the email; LA-2). Closed registration: **BLOCKED** (intended 403, LA-3) |
| POST `/api/auth/login` | public | `{ email, password }` | 200 `{ user: UserSelf, requiresTwoFactor }`; session cookie set | Failure: **BLOCKED** (intended 401, identical for unknown email and wrong password, LA-3) |
| POST `/api/auth/logout` | `auth.logout` | none | 200 `{}`; session revoked | |
| GET `/api/auth/me` | `auth.me` | none | 200 `{ user: UserSelf }` (status and rating are included for the restricted page) | |
| PUT `/api/users/me/handles` | `profile.handles.update` | `{ codeforces?, leetcode? }`, each string or null | 200 `{ handles }` | 409 `CONFLICT` with `fields.<platform>` (handle already linked) |
| POST `/api/auth/2fa/verify` | `auth.2fa.verify` (state-gated) | `{ code }`: 6 digits | 200 `{ user: UserSelf }`; new session cookie, pending one revoked | Wrong or expired code: **BLOCKED** (intended 401, LA-3). Refused with 503 when `TWOFA_ENCRYPTION_KEY` is invalid. `RATE_LIMITED` |
| POST `/api/admin/security/2fa/setup` | `twofa.enroll` | `{ password }` | 200 `{ otpauthUri, secret }`, shown once | Refused with 503 when 2FA configuration is invalid; `ADMIN_2FA_ENABLED=false` makes the route unavailable |
| POST `/api/admin/security/2fa/confirm` | `twofa.enroll` | `{ code }` | 200 `{ enabled: true }` | same as setup |

2FA disable, recovery codes, forgot or reset password and change password do not exist in v1 (T10, B6, B19). The 2FA routes exist behind `ADMIN_2FA_ENABLED` (default false) and must not be enabled in production before LB-2 clears.

## 4. Student routes
| Method and path | Permission | Request | Success | Route errors |
|---|---|---|---|---|
| GET `/api/dashboard` | `dashboard.read` | none | `{ rating, attendance: AttendanceSummary, progress: { solved, total }, upcomingLectures: Lecture[], upcomingContests: Contest[], announcements: Announcement[], streak }`. List sizes: 5 each (PROPOSED) | |
| GET `/api/announcements` | `announcements.read` | `page, limit, type?, q?` | list of Announcement, published only | |
| GET `/api/announcements/:id` | `announcements.read` | | Announcement | `NOT_FOUND` |
| GET `/api/notifications` | `notifications.read` | `page, limit` | list of Notification, owner only. **No mark-read routes in v1** (LD-3) | |
| GET `/api/lectures` | `lectures.read` | `page, limit` | list of Lecture, published only. No filters in v1 (B20) | |
| GET `/api/lectures/:id` | `lectures.read` | | Lecture | `NOT_FOUND` |
| POST `/api/lectures/:id/attendance` | `attendance.checkin` | `{ code }`: 4 digits (prototype; code length is not settled by a frozen document) | 201 `{ record: { lectureId, submittedAt } }` | `ATTENDANCE_INVALID_CODE` 400; `ATTENDANCE_EXPIRED`, `ATTENDANCE_NOT_ACTIVE`, `ATTENDANCE_DUPLICATE` 409; lockout `RATE_LIMITED` |
| GET `/api/attendance/me` | `attendance.read` | `page, limit` | `{ summary: AttendanceSummary, history: { items: [{ lectureId, title, submittedAt }], pagination } }` | |
| GET `/api/contests` | `contests.read` | `page, limit` | list of Contest, published only | |
| GET `/api/contests/:id` | `contests.read` | | Contest | `NOT_FOUND` |
| GET `/api/contests/:id/results` | `results.read` | `page, limit, q?` | list of ContestResult, only when results are published | `NOT_FOUND` otherwise |
| GET `/api/progress/me` | `progress.read` | | `{ solved, total, topics: [{ id, name, slug, solved, total }] }` raw counts only (B18) | |
| GET `/api/progress/topics/:id/problems` | `progress.read` | `page, limit` | list of ProblemProgress, published problems of the topic | `NOT_FOUND` |
| GET `/api/progress/problems/:id` | `problems.read` | | ProblemProgress | `NOT_FOUND` |
| POST `/api/problems/:id/verify` | `problems.check` | none | 200 `{ result, problem: ProblemProgress }`, `result` in `solved, failed, unlinked, unavailable` | `UPSTREAM_ERROR` 502; `RATE_LIMITED` |
| GET `/api/rating/me` | `rating.read` | | `{ value: number|null, components, computedAt, formulaVersion }` from stored rows only | |
| GET `/api/rating/me/history` | `rating.read` | `page, limit` | list of RatingEntry | |
| GET `/api/streak/me` | `streak.read` | | `{ enabled: false }` until B5 is decided. The enabled shape is **BLOCKED (B5)** | |

Notes:
- The solve check is synchronous with a timeout (T13). `pending` is stored in the schema but this route never returns it in v1. It records the platform submission time (B8). The path name does not imply identity or ownership verification; it is the audit's path. LeetCode problems return `unavailable` and award no progress (B7). Rename on request.
- A check-in on an expired session is answered `ATTENDANCE_EXPIRED`, and the lazy closure (`closedAt` set, `codeEnc` cleared) is committed in the same operation (lead decision A1).
- `GET /api/users/me`, `PATCH /api/users/me` and a notification mark-read have no catalogued permission and are not in v1.

## 5. Admin routes
Create bodies require the listed fields; PATCH bodies take any subset (at least one) and never accept ownership, status or internal fields. "manage" covers admin list, detail, create and update for that resource.

| Method and path | Permission | Request | Success | Route errors |
|---|---|---|---|---|
| GET `/api/admin/dashboard` | `admin.dashboard.read` | | `{ stats, recentActivity: AuditEntry[] }`. `recentActivity` is read-only, newest first, **10 entries (PROPOSED)**, fields `action, summary, actor, createdAt`, never `meta` (lead decision A3). The `stats` fields are not defined by any source and are fixed by the dashboard owner from the prototype | |
| GET `/api/admin/audit-log` | `auditlog.read` | `page, limit` | list of AuditEntry. No filters in v1 (only `{ createdAt: -1 }` is indexed) | |
| GET `/api/admin/notifications` | `auditlog.read` | `page, limit` | **BLOCKED** until the `domain.verb` registry exists. It will show only six categories: announcement, lecture, contest and result publication, user restriction, user reopening; no read state, no unread badge, no new index (lead decision A4) | |
| GET `/api/admin/users` | `users.read` | `page, limit, q?, role?, status?` | list of AdminUser | |
| GET `/api/admin/users/:id` | `users.read` | | AdminUserDetail | `NOT_FOUND` |
| POST `/api/admin/users/:id/restrict` | `users.restrict` | `{ reason? }` | AdminUserDetail | `NOT_FOUND`, `INVALID_STATE` if already restricted. Policy OPEN (B2); no UI Restrict button without lead approval |
| POST `/api/admin/users/:id/reopen` | `users.reopen` | `{}` | AdminUserDetail | `NOT_FOUND`, `INVALID_STATE` if not restricted |
| GET, POST `/api/admin/announcements`; GET, PATCH `/api/admin/announcements/:id` | `announcements.manage` | `{ title, body, type }` | Admin Announcement: Announcement plus `status, createdBy, createdAt, updatedAt` | `NOT_FOUND` |
| POST `/api/admin/announcements/:id/publish` | `announcements.publish` | none | Admin Announcement | `NOT_FOUND`, `INVALID_STATE` if already published. Creates notifications for the announcement trigger (B15); the recipient set is defined in `SERVICES.md` |
| DELETE `/api/admin/announcements/:id` | `announcements.delete` | | `{ id }` | `NOT_FOUND` |
| GET, POST `/api/admin/lectures`; GET, PATCH `/api/admin/lectures/:id` | `lectures.manage` | `{ title, description?, scheduledAt, liveUrl?, resources? }`. Resource URLs follow B13 (https in production, no credentials, no `javascript:` or `data:`; length bound not defined) | Admin Lecture: Lecture plus `status` | `NOT_FOUND` |
| POST `/api/admin/lectures/:id/publish` | `lectures.publish` | none | Admin Lecture | `NOT_FOUND`, `INVALID_STATE` |
| DELETE `/api/admin/lectures/:id` | `lectures.delete` | | `{ id }` | `NOT_FOUND`; **409 `INVALID_STATE`** while any session of the lecture has `closedAt: null`, expired or not (lead decision A2; this use of the approved code is PROPOSED for confirmation) |
| GET `/api/admin/attendance` | `attendance.admin.read` | `page, limit, lectureId?` | list of AdminAttendanceSession without `code` | |
| GET `/api/admin/attendance/:sessionId` | `attendance.admin.read` | `page, limit` | `{ session: AdminAttendanceSession, records: { items: [{ userId, name, submittedAt }], pagination } }` | `NOT_FOUND` |
| POST `/api/admin/lectures/:id/attendance/start` | `attendance.manage` | `{ validForSeconds? }`: positive integer; default `ATTENDANCE_DEFAULT_VALID_SECONDS`. Upper bound not defined (B4 OPEN) | 201 AdminAttendanceSession with `code` | `NOT_FOUND`; `INVALID_STATE` while a non-expired open session exists. An expired open session is closed lazily first (A1) |
| POST `/api/admin/attendance/:sessionId/close` | `attendance.manage` | none | AdminAttendanceSession | `NOT_FOUND`; `INVALID_STATE` if already closed (PROPOSED use) |
| GET, POST `/api/admin/contests`; GET, PATCH `/api/admin/contests/:id` | `contests.manage` | `{ title, description?, platform: "codeforces", platformContestId, url, invitationUrl?, startsAt, durationMinutes }` | Admin Contest: Contest fields plus `publication, resultsState, lastFetchedAt, fetchSummary` | `NOT_FOUND` |
| POST `/api/admin/contests/:id/publish` | `contests.publish` | none | Admin Contest | `NOT_FOUND`, `INVALID_STATE`. Creates notifications for the contest trigger (B15) |
| DELETE `/api/admin/contests/:id` | `contests.delete` | | `{ id }` | `NOT_FOUND` |
| GET `/api/admin/contests/:id/results` | `contests.manage` | `page, limit` | list of fetched rows `{ userId, handle, name, rank, points, penalty, fetchedAt }` plus `fetchSummary` | `NOT_FOUND` |
| POST `/api/admin/contests/:id/results/fetch` | `results.fetch` | none | `{ processed, matched, unmatchedHandles, resultsState }`; idempotent upsert on contest and user (T14) | `UPSTREAM_ERROR` 502; `INVALID_STATE` after publish (B9: published results are not editable through the API) |
| POST `/api/admin/contests/:id/results/publish` | `results.publish` | none | Admin Contest | `INVALID_STATE` unless results are fetched. Creates no notification rows (B15 has no results trigger) |
| GET, POST `/api/admin/topics`; GET, PATCH `/api/admin/topics/:id` | `topics.manage` | `{ name, slug, order }`; slug unique among non-deleted topics | Topic `{ id, name, slug, order }` | `CONFLICT` duplicate slug; `NOT_FOUND` |
| DELETE `/api/admin/topics/:id` | `topics.delete` | | `{ id }` | `INVALID_STATE` 409 while the topic has non-deleted problems (T9) |
| GET, POST `/api/admin/problems`; GET, PATCH `/api/admin/problems/:id` | `problems.manage` | `{ title, topicId, platform, url, value?, externalRef }`; one topic per problem (B18). `GET` filters `topicId?, status?` | Admin Problem: ProblemProgress fields without progress plus `status` | `NOT_FOUND` |
| POST `/api/admin/problems/:id/publish` | `problems.publish` | none | Admin Problem | `NOT_FOUND`, `INVALID_STATE` |
| DELETE `/api/admin/problems/:id` | `problems.delete` | | `{ id }` | `NOT_FOUND` |
| GET `/api/admin/progress` | `progress.admin.read` | `page, limit, q?` | list `{ userId, name, solved, total }` raw counts | |
| GET `/api/admin/progress/:userId` | `progress.admin.read` | `page, limit` | list of ProblemProgress for that student | `NOT_FOUND` |
| GET `/api/admin/rating` | `rating.admin.read` | `page, limit` | list `{ userId, name, rating, computedAt }` | |
| POST `/api/admin/rating/recalculate` | `rating.recalculate` | none | **BLOCKED**: depends on the B1 formula; no response contract and no code until LA-1(b) is decided. The route is not released | |

## 6. Coverage check
- Every route in §3–§5 appears once with exactly one of: `public` (`POST /api/auth/register`, `POST /api/auth/login`) or one catalogued permission. All 44 permissions in `MASTER_ARCHITECTURE.md` §7.3 are used by at least one route, and no route uses a permission outside that catalog. The automated route-coverage check of §7.4 still has to be written by A4; **it does not exist and has not run.**
- `/api/admin/notifications` and `/api/admin/audit-log` both use `auditlog.read`, because the notifications view is a view over `AuditLog` (T20).

## 7. Removed or held relative to the earlier draft
| Earlier route or rule | Disposition | Reason |
|---|---|---|
| `422` status | Removed | T2: all invalid input is 400 `VALIDATION_ERROR` |
| `/auth/forgot-password`, `/auth/reset-password`, `PATCH /users/me/password` | Held, not in v1 | T10, B19 (LB-1) |
| `/auth/2fa/setup`, `/confirm`, `/disable` | Enrollment moved to `/api/admin/security/2fa/*`; disable held | T10, B6 |
| `GET/PATCH /users/me` | Not in v1 | T10; no catalogued permission; `GET /api/auth/me` is the profile read |
| Generic `PATCH /admin/users/:id` | Removed | T11 |
| Global `/topics`, `/problems` for students | Replaced by `/api/progress/*` | T12 |
| `/attendance/sessions*`, `PATCH /admin/attendance/records/:id` | Replaced by lecture-based routes; no corrections | T3, B4 |
| `/leaderboard`, `/integrations/*`, results `import` | Removed | T11, T13, T14, B10, B9 |
| Notification mark-read routes | Not in v1 | LD-3, B15 |
| Universal `/dashboard`, "explicit permission", `/admin/system/health` | Split dashboards; single admin role; health removed | T20, T11 |
| Audit routes `/session/start`, `/session/end`, `/admin/users/:id/status` | Removed | T7, B12; separate restrict and reopen permissions |

## 8. Open decisions and blocked items
| Item | Status |
|---|---|
| The five BLOCKED response contracts (LA-3) | BLOCKED |
| `POST /api/admin/rating/recalculate`, B1 formula (LA-1(b)) | BLOCKED |
| `GET /api/admin/notifications` (needs the `domain.verb` registry) | BLOCKED |
| Streak enabled shape (B5); lecture `state` values (B12) | OPEN, partially blocked |
| 409 `INVALID_STATE` for lecture-delete refusal, session close of a closed session | PROPOSED use of an approved code, to be confirmed |
| Dashboard `stats` fields; the owner of `GET /api/admin/dashboard` (not assigned by L1) | Open; assigned in batch 3 (`TEAM_WORKFLOW.md`) |
| Attendance code length (4 digits per prototype, not frozen); `validForSeconds` upper bound (B4) | Open |
| Duplicate-email behavior (LA-2); admin restriction of another admin (B2, B14) | Open |
| Route name `/verify` for the provisional solve check | Open, rename on request |
| Dashboard list sizes (5) and recent activity size (10) | PROPOSED |

## 9. Contract test checklist
For every route: happy path, invalid input, unauthenticated, wrong role, restricted-account access (only `auth.me`, `auth.logout`, login), 2FA-pending access, not-found, duplicate or conflict, rate limiting where relevant, and an `AuditLog` row for every admin mutation. Report exactly what was run; no test has been run.

## 10. Freeze status
Contract direction approved by the lead; LA-1 to LA-5 and every BLOCKED item stay blocked until their decisions are recorded. Not frozen. Required before freeze: approval of this file, `AUTH_AND_SECURITY.md` and `DATABASE_SCHEMA.md`; decisions on LA-1 to LA-5 and the S-values; `SERVICES.md` for service signatures; the route-coverage check written by A4. Contract changes after freeze need a written proposal and lead approval.
