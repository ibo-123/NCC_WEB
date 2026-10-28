# Services Contract

**Contract revision:** Phase 3, batch 4 (draft; direction approved by the lead, LA-1 to LA-5 and BLOCKED items still blocked). Owner: A1. Subordinate to `DECISIONS.md` and `MASTER_ARCHITECTURE.md` (frozen); routes and DTOs are in `API_CONTRACT.md`, models in `DATABASE_SCHEMA.md` (rev 3, approval pending), security rules in `AUTH_AND_SECURITY.md`. Status words are defined in `DECISIONS.md` §1. Signatures below are the agreed interface between accounts; nothing is implemented, and nothing has been run or tested. Where this file differs from a frozen document, the frozen document wins.

## 1. Rules
- **Services hold all business rules.** Route handlers are thin: validate, call one service, return the envelope. Pages never call models.
- **Shape:** `serviceName(ctx, input) → result`, where `ctx = { actor: { id, role } | null, correlationId, now }`. `now` is injected so tests do not use the real clock. Services read configuration only through `lib/config`, never `process.env`.
- **Errors:** throw `AppError(code, fields?)` from `lib/http` (A2) with a code from the `MASTER_ARCHITECTURE.md` §6.4 registry. PENDING codes are not used; a BLOCKED response is not implemented.
- **Transactions:** multi-document writes run inside `runInTransaction(fn)` from `lib/db` (A3), which needs a replica set.
- **Audit and activity:** every admin mutation calls `audit()` with an action constant from one registry module owned by A3 (it does not exist yet, so the `domain.verb` strings are not fixed). Services import constants, never literals.
- **Cross-domain access:** a service uses another domain only through the exports listed here. Shared helpers come from A3; permission checks from A4. No domain writes another domain's collections.
- **Serializers:** each domain exports `to<Dto>()` mappers matching `API_CONTRACT.md` §2. They never return `passwordHash`, `tokenHash`, `secretEnc`, `codeEnc` or `meta`.
- **Length bounds** for text fields are set by the owning account in its Zod schema and recorded in its section below. None is defined by any source.

## 2. Shared helpers
| Owner | Signature | Behavior |
|---|---|---|
| A3 | `audit({ actorId, action, entityType, entityId, summary, meta?, correlationId })` | Appends an `AuditLog` row. `summary` and `meta` never hold secrets. Takes the caller's transaction. |
| A3 | `notify({ userIds, type, title, body, href? })` | Inserts `Notification` rows. Used only by the three B15 triggers. |
| A3 | `recordActivity({ userId, type, refId, occurredAt })` | Idempotent insert; the unique `(userId, type, refId)` index is the guard; `day` from `campusDay`. |
| A3 | `runInTransaction(fn)`, `listAuditEntries({ page, limit })` | `listAuditEntries` returns `AuditEntry` DTOs without `meta`. |
| A2 | `AppError`, `ok(data)`, `parsePagination(query)`, `withApi(declaration, handler)`, `assertConfigReady(scope)`, `campusDay(date)` | `campusDay` uses `CAMPUS_TIMEZONE` (PROPOSED). `withApi` consumes A4's `resolveAccess`. |
| A4 | `resolveAccess(request, declaration)` → `{ user, session }` | Session lookup, per-request role and status, allow-lists and `can()`. A2's `withApi` calls it. |
| A4 | `can(role, permission)`, `consumeRateLimit(scope, subject)` → `{ allowed, retryAfterSeconds }` | Rate limiting is atomic and Mongo-backed (`AUTH_AND_SECURITY.md` §7). |
| A4 | `encrypt(purpose, ownerId, plaintext)`, `decrypt(purpose, ownerId, value)` | `MASTER_ARCHITECTURE.md` §8.3: purposes `attendance-code` and `admin-2fa-secret`, purpose-bound keys, matching-context rule. |

## 3. A4: auth and users
| Service | Serves | Notes |
|---|---|---|
| `registerUser(ctx, { name, email, password })` | `POST /auth/register` | Honors `REGISTRATION_MODE`. Closed registration has no response contract yet (BLOCKED, LA-3). A duplicate email returns the interim 409 `CONFLICT`. Creates no session. |
| `loginUser(ctx, { email, password })` | `POST /auth/login` | Returns `{ user, requiresTwoFactor }` and a new session. Failure response BLOCKED (LA-3). Dummy-hash comparison for unknown emails (PROPOSED). |
| `logoutSession(ctx)`; `getCurrentUser(ctx)` | logout, `GET /auth/me` | |
| `updateHandles(ctx, { codeforces?, leetcode? })` | `PUT /users/me/handles` | Trim; empty means unset; unique case-insensitive. |
| `verifyTwoFactor(ctx, { code })`, `startTwoFactorEnrollment(ctx, { password })`, `confirmTwoFactorEnrollment(ctx, { code })` | 2FA routes | Only behind `ADMIN_2FA_ENABLED`. Never bypassed; configuration failure leaves the session pending. |
| `listUsers(ctx, query)`, `getUser(ctx, id)` | admin users | |
| `restrictUser(ctx, id, { reason? })`, `reopenUser(ctx, id)` | restrict, reopen | User update and `audit()` in one transaction. No session revocation. |
| `revokeUserSessions(userId)`, `setUserRole(ctx, id, role)` | none (scripts only) | `setUserRole` revokes all sessions and audits in one transaction. No route in v1 (B3). |

## 4. A5: learning
| Service | Serves | Notes |
|---|---|---|
| `listAnnouncements(ctx, { page, limit, type?, q? })`, `getAnnouncement(ctx, id)` | student announcements | Published, not deleted. |
| `adminAnnouncements`: `list, get, create, update, publish, remove` | admin announcements | `publish` also calls `notify` once (announcement trigger). `remove` is a soft delete. |
| `listLectures(ctx, { page, limit })`, `getLecture(ctx, id)` | student lectures | Includes `attendance: { sessionOpen, checkedIn }`. |
| `deriveLectureState(lecture, now)` | Lecture `state` | Values are **OPEN (B12)**; until decided it returns `null` and the UI hides state-dependent labels. |
| `adminLectures`: `list, get, create, update, publish, remove` | admin lectures | `remove` refuses with 409 `INVALID_STATE` while any session has `closedAt: null`, expired or not (lead decision A2; use of the approved code is PROPOSED). Attendance records are kept. |
| `startAttendance(ctx, lectureId, { validForSeconds? })` | start | Closes an expired open session lazily first (A1); otherwise refuses an unexpired one. Generates the ObjectId, then encrypts the code with it as owner. |
| `checkIn(ctx, lectureId, code)` | `POST /lectures/:id/attendance` | Rate limits, constant-time compare, atomic unique insert, `recordActivity`, one `notify` (attendance trigger). An expired session is closed lazily and the close commits even though the answer is `ATTENDANCE_EXPIRED`. |
| `closeAttendance(ctx, sessionId)`; `closeIfExpired(session, now)` | close; lazy closure | Sets `closedAt` to the server time and clears `codeEnc`. Admin reads never close sessions (A1). |
| `listAttendanceSessions`, `getAttendanceSession`; `getMyAttendance(ctx, query)`; `getAttendanceSummary(userId)` | admin and student attendance | Summary is `{ attended, percentage: null }` (B4). No corrections. |
| `listNotifications(ctx, query)` | `GET /notifications` | Owner only. No mark-read. |
| `getStudentDashboard(ctx)`; `getAdminDashboard(ctx)` (proposed owner A5) | dashboards | `recentActivity` via `listAuditEntries`, 10 entries (PROPOSED). Admin `stats` fields are open. |

**B15 notification contract.** Triggers are exactly three: announcement published, contest published, attendance recorded. Proposed `type` identifiers (PROPOSED, closes `DATABASE_SCHEMA.md` §8): `announcement_published`, `contest_published`, `attendance_recorded`. Proposed recipients: announcement and contest, all active students at publish time; attendance, the student who checked in. The recipient set is not defined by any frozen document. Publication of results, lectures and other admin events create **no** notification rows; they only appear in the admin notifications view, which is BLOCKED (A4).

## 5. A6: competition and progress
| Service | Serves | Notes |
|---|---|---|
| `adminTopics`, `adminProblems`: `list, get, create, update, remove`; problems also `publish` | admin topics and problems | A topic cannot be deleted while it has non-deleted problems (409 `INVALID_STATE`, T9). Soft delete throughout. |
| `getMyProgress(ctx)`, `listTopicProblems(ctx, topicId, query)`, `getProblemProgress(ctx, id)` | student progress | Raw solved and total counts only (B18). |
| `checkSolve(ctx, problemId)` → `{ result, problem }` | `POST /problems/:id/verify` | Synchronous with a timeout. `result` in `solved, failed, unlinked, unavailable`. LeetCode returns `unavailable` and records no progress (B7). |
| `isSolveEligible({ problem, submission, user })` → boolean | called by `checkSolve` only | **TEMPORARY default:** accepts any accepted submission and records its platform time (`solvedAt`). This is a **provisional solve check**, not completed verification and not ownership proof (B8). Eligibility rules live only here. |
| `fetchUserSubmissions(handle, { timeoutMs })`, `fetchContestStandings(contestId, { timeoutMs })` (`lib/integrations`) | Codeforces client | Bounded timeout and retries (PROPOSED: 10 s, at most one retry). Failure becomes `UPSTREAM_ERROR`. |
| `adminContests`: `list, get, create, update, publish, remove` | admin contests | `publish` calls `notify` once (contest trigger). |
| `fetchResults(ctx, contestId)`, `listFetchedResults(ctx, contestId, query)`, `publishResults(ctx, contestId)` | results | `fetchResults` is an idempotent upsert on contest and user and refuses after publish. `publishResults` creates no notification rows. |
| `listContests(ctx, query)`, `getContest(ctx, id)`, `listResults(ctx, contestId, query)` | student contests | Results only when published. |
| `getMyRating(ctx)`, `listRatingHistory(ctx, query)`, `listAdminRating(ctx, query)` | rating reads | Stored rows only. |
| `computeRating(inputs, config)`; `recalculateRatings(ctx)` | none released | **BLOCKED (B1, LA-1(b)):** no formula, no response contract. `formulaVersion` is the only formula field. |
| `getStreak(ctx)` | `GET /streak/me` | `{ enabled: false }` unless `STREAK_QUALIFYING_TYPES` is set; the enabled shape is **BLOCKED (B5)**. |
| `listProgressByStudent(ctx, query)`, `getStudentProgress(ctx, userId, query)` | admin progress | Raw counts. |

## 6. Operations that must be transactional
Restrict and reopen (user plus audit); `setUserRole` (user, session revocation, audit); every publish (status, notifications, audit); attendance start (lazy close plus insert); check-in (record, activity, notification, lazy close); attendance close (close, clear code, audit); lecture soft delete (refusal check plus delete plus audit); results fetch (upserts plus summary); rating insert with the `ratingCurrent` cache (when B1 allows it). Index guards prevent duplicates; services never use read-then-write for them.

## 7. Open or blocked in this contract
| Item | Status |
|---|---|
| Lecture `state` values (B12); streak enabled shape (B5); rating formula (B1) | OPEN or BLOCKED as marked |
| `domain.verb` action registry; admin notifications view | Not established; the view is BLOCKED |
| Notification type identifiers and recipient sets | PROPOSED; lead to confirm |
| Admin dashboard owner (A5) and `stats` fields | Proposed owner; fields open |
| Whether system lazy closures are audit-logged | Unsettled (T24 covers admin mutations only) |
| `isSolveEligible` default; Codeforces timeout and retry; recent-activity size | TEMPORARY or PROPOSED |
| Responses for the five BLOCKED codes (LA-3); LA-1, LA-2 | Unresolved |
