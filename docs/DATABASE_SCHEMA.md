# Database Schema Contract

**Contract revision:** Phase 3, batch C, revision 3 (draft for lead review). Lead decisions for batch C are recorded in §11; they do not approve batch C as a whole. Subordinate to `DECISIONS.md` and `MASTER_ARCHITECTURE.md`, which are frozen. Where this file differs from them, they win; report the difference. Status words (`APPROVED`, `OPEN`, `PROPOSED`, `UNVERIFIED`, `PENDING`, `BLOCKED`) are defined in `DECISIONS.md` §1. Nothing here claims an install, build, test or index creation has been run. None was.

**Source tags** used in the field tables: **A** = architecture audit §5; **P** = original schema draft; **T#/B#** = `DECISIONS.md`; **M** = `MASTER_ARCHITECTURE.md`. **Lead** = a lead decision recorded in §11. **derived** = an implementation choice derived from a cited requirement; no source states it, it is not itself a sourced requirement, and A3 or the lead may revisit it. A field with no tag does not exist. Nothing was added to make the schema look complete.

## 1. Shared rules
- MongoDB with Mongoose, JavaScript. One canonical model per collection, using the hot-reload-safe model reuse pattern. **A3 owns every model file and index** (`DECISIONS.md` L1, `MASTER_ARCHITECTURE.md` §4). Feature owners propose changes by pull request to A3.
- IDs are ObjectIds, exposed to clients as strings. Validate incoming IDs before querying.
- All times are stored as UTC `Date` values from the server clock and serialized as ISO-8601 (B17, M §6.1). Campus-entered dates are converted at the service boundary.
- `timestamps: true` (`createdAt`, `updatedAt`) on every model except `AuditLog`, which is append-only and has `createdAt` only.
- Internal security fields are `select: false` and never appear in serializers: `User.passwordHash`, `User.twoFactor.secretEnc`, `Session.tokenHash`, `AttendanceSession.codeEnc`. `select: false` is an accidental-exposure guard only, never protection (T4).
- Indexes are defined in model code. Index changes after freeze need an impact note and lead approval. Index definitions below are **UNVERIFIED** until created against a real MongoDB; A3 checks each one (especially the partial and collation indexes) against the MongoDB and Mongoose documentation.
- Schema validation, request validation and business validation are separate. Do not rely on Mongoose middleware as the only enforcement of authorization or workflow rules.
- Derived values are stored only with a consistency rule. The three allowed copies are in §4 (`ratingCurrent`, `AttendanceRecord.lectureId`, `ProblemVerification.platform`).
- Multi-document writes use transactions (M §6.1, §9).
- Any schema change after freeze needs a written proposal, impact analysis and lead approval.

## 2. Model inventory
Owner of all models: A3. "Writer" is the account whose services write the model.

| Model | Writer | Purpose |
|---|---|---|
| User | A4 (role/status changes via admin services) | Identity, role, status, handles, rating cache, 2FA |
| Session | A4 | Hashed opaque session |
| Topic, Problem, ProblemVerification | A6 | Learning content and solve checks |
| Lecture, AttendanceSession, AttendanceRecord, Announcement, Notification | A5 | Learning, attendance, announcements, in-app notifications |
| Contest, ContestResult, RatingHistory, ActivityEvent | A6 | Contests, rating, activity |
| AuditLog | A3 helper, called by every writer | Admin and security mutation history |
| RateLimit | A4 | Durable rate-limit counters and lockouts |

There is **no** `ContestInvitation` model (B11) and **no** challenge model (lead decision A5, §11).

## 3. Status vocabulary (T8)
These are the only permitted values. No spelling variants.

| Model.field | Values | Notes |
|---|---|---|
| `User.role` | `student`, `admin` | |
| `User.status` | `active`, `restricted` | No `disabled` (B2). Policy for what "restricted" means is OPEN (B2). |
| `Announcement.status`, `Lecture.status`, `Problem.status` | `draft`, `published` | No scheduled publishing (T8). |
| `Contest.publication` | `draft`, `published` | |
| `Contest.resultsState` | `not_fetched`, `fetched`, `published` | |
| Contest status (upcoming, active, completed) | derived, **not stored** | Computed from `startsAt` and `durationMinutes`. |
| `ProblemVerification.status` | `pending`, `solved`, `failed` | "Not solved" means no document. `solved` is a provisional solve check (B8), never ownership proof. |
| `Problem.platform` | `codeforces`, `leetcode` | |
| `Contest.platform` | `codeforces` | |
| `Lecture.resources[].type` | `pdf`, `link`, `file` | `file` is a label for a downloadable URL (B13). |
| `Announcement.type` | `general`, `important`, `contest`, `lecture`, `attendance` | A |
| `RatingHistory.source` | `initial`, `scheduled`, `manual` | T15 |
| `ActivityEvent.type` | `problem_solved`, `attendance`, `contest_result`, `rating_change` | Recorded types only. Which types qualify for a streak is OPEN (B5). |

`Topic` has no status. Lecture state (upcoming, live, completed) is **not stored**: one server function derives it (T7), and its rules are OPEN (B12).

## 4. Models
Types: `ref X` is an ObjectId reference. `?` = nullable or optional.

### 4.1 User
| Field | Definition | Source |
|---|---|---|
| `name` | String, required, trimmed | A |
| `email` | String, required, trimmed and lowercased before save. The original casing is **not preserved** (Lead B5). | A, Lead B5 |
| `passwordHash` | String, required, `select:false` | P |
| `role` | Enum §3, required | A, P |
| `status` | Enum §3, default `active` | A, B2 |
| `restrictedAt` | Date? | A |
| `restrictedReason` | String? | A |
| `handles.codeforces`, `handles.leetcode` | String?, optional. Trimmed before persistence; an empty or whitespace-only value is stored as **missing (unset)**, never as an empty string (this rule: Lead, see the provenance note in §11). Validated (patterns not defined, §8). | A, Lead |
| `ratingCurrent` | Number?, cache of the latest `RatingHistory.value`. Only the rating service writes it, in the same transaction as the history insert (T15). | T15 |
| `twoFactor.enabled` | Boolean, default `false` | A |
| `twoFactor.secretEnc` | String?, `select:false`, encrypted per §5.2 | A, T4 |
| `twoFactor.enabledAt` | Date? | A |
| `twoFactor.lastUsedStep` | Number?, the TOTP time step of the last accepted code, written by an atomic conditional update. **PROPOSED schema change (S-6, TOTP replay prevention); not part of rev 3 until A3 coordination and the lead's approval.** | Lead S-6 (PROPOSED) |
| `lastLoginAt` | Date? | A |

Indexes:
- `email` unique (A).
- `{ role: 1, status: 1 }` (A).
- `handles.codeforces` and `handles.leetcode`: each unique, **case-insensitive** (collation, strength 2) and partial on `$type: "string"` so absent handles do not collide (T13). Required: one account per handle, compared case-insensitively after trimming. Because empty values are never persisted (see the field row), they cannot collide under these indexes. **UNVERIFIED:** the index behavior (collation, partial filter, treatment of null and missing) until A3 validates it against the MongoDB and Mongoose versions actually used.
- Admin user search (text index `{ name, email }` or regex): the audit left this open and no decision exists. This contract requires neither; A3 reports the choice in the pull request.

Rules: role and status change only through authorized admin services and are audited (T24). Client-supplied role, status or rating is never trusted. No `deletedAt`: there is no account deletion in v1 (B16). No recovery codes (B6). Who restricted or reopened a user, and when, is recorded in `AuditLog` (T24), not on the user.

### 4.2 Session
Opaque server-side session (`DECISIONS.md` §3). Role and status are **not** stored here; they are read from `User` on every request (T17, M §5).

| Field | Definition | Source |
|---|---|---|
| `userId` | ref User, required | A |
| `tokenHash` | String, required, unique. HMAC of the opaque token keyed with `SESSION_SECRET` (T19). The raw token is never stored. | A, T19 |
| `expiresAt` | Date, required | A |
| `lastUsedAt` | Date | P |
| `revokedAt` | Date? | P |
| `userAgent` | String?, a short summary only; no IP address (T19) | A, T19 |
| `twoFactorVerified` | Boolean, **required, no schema default**. The login service sets it explicitly; the rules are in `AUTH_AND_SECURITY.md` (batch D). `false` marks a session awaiting 2FA (M §7.2). | A, M |
| `reauthAt` | Date? (recent re-authentication, T19) | T19 |

Indexes: `tokenHash` unique (A); `expiresAt` **TTL** with `expireAfterSeconds: 0` (A, B16); `{ userId: 1 }` (**derived**: no source lists this index; it supports the revocation T17 requires on role change, admin 2FA reset and account deletion).
Validation: application code rejects an expired or revoked session whether or not the TTL has run (P).

### 4.3 Topic
| Field | Definition | Source |
|---|---|---|
| `name` | String, required | A |
| `slug` | String, required | A |
| `order` | Number | A |
| `deletedAt` | Date? | T9 |

Indexes: `slug` unique **among non-deleted topics**: a partial unique index that excludes documents where `deletedAt` is set. A soft-deleted topic's slug becomes reusable by a new topic, and the soft-deleted record is preserved (Lead B3; the audit lists a plain unique `slug`, A). Lookups by slug filter out deleted topics (§7). **UNVERIFIED:** the exact partial filter, including null versus missing `deletedAt` as in §4.7; A3 validates it.

### 4.4 Problem
| Field | Definition | Source |
|---|---|---|
| `title` | String, required | A |
| `topicId` | ref Topic, required. **One topic per problem** (B18). | A, B18 |
| `platform` | Enum §3, required | A |
| `value` | Number, **optional**. No calculation attaches to it (B18). | A, B18 |
| `url` | String, required (external problem link) | A |
| `externalRef` | Codeforces: `{ contestId: Number, index: String }`. LeetCode: `{ titleSlug: String }` | A |
| `status` | Enum §3, default `draft` | A, T8 |
| `deletedAt` | Date? | A, T9 |

Indexes: `{ topicId: 1, status: 1 }`; text index on `title` (both A).

### 4.5 ProblemVerification
A **provisional solve check** (T13, B8), not completed verification and not ownership proof.

| Field | Definition | Source |
|---|---|---|
| `userId` | ref User, required | A |
| `problemId` | ref Problem, required | A |
| `status` | Enum §3 | A |
| `platform` | Enum §3. Snapshot copied from the problem at creation and never rewritten. | A |
| `solvedAt` | Date?, the **platform's submission time** of the accepted submission (B8) | A, B8 |
| `verifiedAt` | Date?, server time of the check that found it. Not proof of ownership. | A |
| `lastCheckedAt` | Date? | A |
| `attempts` | Number, default 0 | A |
| `failureReason` | String? | A |

Indexes: unique `{ userId: 1, problemId: 1 }` (A). Rules: no third-party credentials are stored (P). A `solved` document is **never** written for a LeetCode problem in v1 (B7). "Account not linked" is derived from `User.handles`, not stored (A).

### 4.6 Lecture
| Field | Definition | Source |
|---|---|---|
| `title` | String, required | A |
| `description` | String | A |
| `scheduledAt` | Date (UTC), required | A |
| `liveUrl` | String? | A |
| `status` | Enum §3, default `draft` | A, T8 |
| `resources[]` | Subdocuments `{ title: String, type: Enum §3, url: String }` | A, B13 |
| `deletedAt` | Date? | A, T9 |

Indexes: `{ status: 1, scheduledAt: 1 }` (A).
Not stored: no duration field (B12), no `sessionState` (the audit's field is replaced by the derived lecture state, T7).
Resource URL validation (B13): `https` only in production, a bounded length, no embedded credentials, no `javascript:` or `data:` scheme. No uploads. The length bound is not defined by any source (§8).

### 4.7 AttendanceSession
| Field | Definition | Source |
|---|---|---|
| `lectureId` | ref Lecture, **required** | T6 |
| `codeEnc` | String?, `select:false`, encrypted per §5.1. Replaces the audit's plain `code` and the draft's hash. | T4 |
| `openedBy` | ref User (admin), required | A |
| `opensAt` | Date, required | A |
| `expiresAt` | Date, required | A |
| `closedAt` | Date? | A |

Indexes: **partial unique** on `lectureId` where the session is open (`closedAt` is null): one open session per lecture (T6, A). **UNVERIFIED:** whether `partialFilterExpression` accepts a null equality as written; A3 verifies it and, if not, uses an equivalent supported form that gives the same guarantee. No TTL index (B16). An expired session with `closedAt: null` still counts as open for this index until it is closed; under lead decision A1 it is closed lazily (§11), so starting the next session for that lecture is not blocked by it.
Failed attempts are **not** stored here. Counters live in `RateLimit`, keyed by session and user (T5).
The admin-chosen validity is applied when computing `expiresAt`; the value is not stored separately.

### 4.8 AttendanceRecord
Records exist **only for check-ins**; "missed" is derived (T6). No `status`, no correction fields, no manual source (B4).

| Field | Definition | Source |
|---|---|---|
| `sessionId` | ref AttendanceSession, required | A |
| `lectureId` | ref Lecture, required. Copy of the session's `lectureId`, set in the same write, never rewritten. | A |
| `userId` | ref User, required | A |
| `submittedAt` | Date, server time | A |

Indexes: unique `{ sessionId: 1, userId: 1 }` (A, P). Duplicate check-in is rejected by this index; use an atomic write, not read-then-write.

### 4.9 Contest
| Field | Definition | Source |
|---|---|---|
| `title`, `description` | String | A |
| `platform` | Enum §3 (`codeforces`) | A |
| `platformContestId` | String or Number as the platform defines it | A |
| `url` | String | A |
| `invitationUrl` | String?. A plain link field. There is no invitation model (B11). | A, B11 |
| `startsAt` | Date (UTC), required | A |
| `durationMinutes` | Number, required (contest length, used for the derived status) | A |
| `publication` | Enum §3, default `draft` | A, T8 |
| `resultsState` | Enum §3, default `not_fetched` | A, T8 |
| `lastFetchedAt` | Date? | A |
| `fetchSummary` | `{ processed: Number, matched: Number, unmatchedHandles: [String] }`. The size cap on `unmatchedHandles` is not defined by any source (§8). | A, T14 |
| `deletedAt` | Date? | A, T9 |

Indexes: none are specified by any approved source. Proposed additions follow the §1 change rule.

### 4.10 ContestResult
Stores source-provided values as fetched (B10). No scoring or ranking policy is applied.

| Field | Definition | Source |
|---|---|---|
| `contestId` | ref Contest, required | A |
| `userId` | ref User, required | A |
| `handle` | String, the handle matched at fetch time | A |
| `rank` | Number, as provided by the source | A, B10 |
| `points` | Number, the source-provided points as stored at fetch (B10). The field name is a lead decision (B4); the audit calls it `score`. This is stored source data only. Any future official score formula is separate, is not defined or implied here, and stays OPEN (B10). | B10, Lead B4 |
| `penalty` | Number, as provided by the source | A, B10 |
| `fetchedAt` | Date | A |

Indexes: unique `{ contestId: 1, userId: 1 }` (A). Re-fetch before publish is an idempotent upsert on this key (T14). Students see results only when `Contest.resultsState` is `published` (A).

### 4.11 RatingHistory
Auditable rating changes (T15). **No formula is defined or implied (B1).**

| Field | Definition | Source |
|---|---|---|
| `userId` | ref User, required | A |
| `previous` | Number? | A |
| `value` | Number, required (no range is fixed; the scale is part of B1) | A |
| `change` | Number? | A |
| `source` | Enum §3 | A |
| `components` | `{ problem: Number?, contest: Number?, attendance: Number? }` | A, T15 |
| `runId` | String | A, T15 |
| `computedAt` | Date, server time | A |
| `formulaVersion` | String?. The only formula-related field (B1). | T15, B1 |

Indexes: `{ userId: 1, computedAt: -1 }` (A). Rule: the `User.ratingCurrent` cache is written only by the rating service in the same transaction as the insert (T15).

### 4.12 ActivityEvent
| Field | Definition | Source |
|---|---|---|
| `userId` | ref User, required | A |
| `type` | Enum §3 | A |
| `refId` | ObjectId of the source record, required | A, T16 |
| `occurredAt` | Date, server time | A |
| `day` | String `YYYY-MM-DD`, the **campus-time-zone** calendar day of `occurredAt` (T16). The `YYYY-MM-DD` string representation is approved by the lead (Lead B1). If the campus time zone (B17, PROPOSED) changes, stored `day` values must be recomputed. | A, T16, Lead B1 |

Indexes: unique `{ userId: 1, type: 1, refId: 1 }` (T16). Written only by the owning services; client-submitted events are never authoritative (P). Which types count toward a streak, and any link to rating, are OPEN (B5).

### 4.13 Announcement
| Field | Definition | Source |
|---|---|---|
| `title`, `body` | String, required | A |
| `type` | Enum §3 | A |
| `status` | Enum §3, default `draft` | A, T8 |
| `publishedAt` | Date? | A |
| `createdBy` | ref User, required | A |
| `deletedAt` | Date? | T9 |

Indexes: `{ status: 1, publishedAt: -1 }` (A). Soft-deleted (T9), superseding the audit's hard delete.

### 4.14 Notification
In-app only (B15).

| Field | Definition | Source |
|---|---|---|
| `userId` | ref User, required (recipient) | A |
| `type` | String. One value per B15 trigger: announcement published, contest published, attendance recorded. Exact identifiers are fixed in the services contract (batch F). No other types in v1. | A, B15 |
| `title`, `body` | String | A |
| `href` | String?, an internal path | A |
| `readAt` | Date? | A |

Indexes: `{ userId: 1, createdAt: -1 }` (A).

### 4.15 AuditLog
Append-only from the application; no update or delete path for ordinary admins (P). No TTL and no purge (B16).

| Field | Definition | Source |
|---|---|---|
| `actorId` | ref User? (null for system actions) | A, P |
| `action` | String from the `domain.verb` registry (for example `lecture.publish`) covering every admin mutation | A, T24 |
| `entityType`, `entityId` | String, ObjectId? | A |
| `summary` | String | A |
| `meta` | Mixed. Safe data only: never passwords, tokens, TOTP secrets, encryption keys, recovery tokens or attendance codes. | A, P |
| `correlationId` | String | T24 |
| `createdAt` | Date | A |

Indexes: `{ createdAt: -1 }` (A).
What this collection feeds:
- **Admin notifications view** (T20: a view over `AuditLog`). It creates no `Notification` rows, and B15's three triggers are unchanged. Lead decision A4: it shows **only** these six categories: announcement publication, lecture publication, contest publication, result publication, user restriction and user reopening. It has **no read state and no unread badge** in v1. The exact `domain.verb` strings are mapped when the T24 action registry is established. No index is added for this filtering; any addition goes through the §1 change rule with the schema change documented and reviewed.
- **Admin dashboard recent activity** (Lead A3): a read-only list of recent entries that exposes only `action`, the safe `summary` (written without secrets, as for `meta`), the actor and the time. `meta` is never exposed. Permission boundary: the existing admin dashboard permission (`admin.dashboard.read`, `MASTER_ARCHITECTURE.md` §7.3). The entry count and any granular permission mapping are left to `API_CONTRACT.md` (batch E).

### 4.16 RateLimit
Required, not optional: attendance attempt counters and rate limits are Mongo-backed (T5, T23).

| Field | Definition | Source |
|---|---|---|
| `key` | String, required, unique: scope plus a hashed or non-sensitive subject (for example session plus user, or an IP). The hashing method is defined in `AUTH_AND_SECURITY.md` (batch D). Raw passwords and tokens are never stored. | A, P, T5 |
| `count` | Number | A |
| `windowStartsAt` | Date | P |
| `lockedUntil` | Date? | P |
| `expiresAt` | Date, required | A |

Indexes: `key` unique (**derived**: no source states uniqueness; it supports the atomic-update requirement, T5, T23, P); `expiresAt` **TTL** with `expireAfterSeconds: 0` (A, B16). Updates are atomic (`findOneAndUpdate` or equivalent), never read-then-write.

## 5. Encrypted storage (T4)
Algorithm, key handling, key selection and the matching-context rule are defined in `MASTER_ARCHITECTURE.md` §8.3 and are **not restated or changed here**. Stored form for both fields: `v1.<keyId>.<iv>.<tag>.<ciphertext>` (base64url). A schema validator checks the shape `^v1\.[0-9a-f]{8}(\.[A-Za-z0-9_-]+){3}$`. The associated-data context is **not stored**; the caller reconstructs it.

### 5.1 Attendance code: `AttendanceSession.codeEnc`
- Purpose label `attendance-code`; owner identifier: the session's own `_id`. The service **generates the ObjectId before insert** so it can encrypt, then inserts with that `_id`.
- Keys: only `ATTENDANCE_CODE_ENCRYPTION_KEY` and, when present, `ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS`. The `TWOFA_ENCRYPTION_KEY` is never used for this field.
- Lifetime: set at open; set to `null` when the session closes or expires (T4; clearing on expiry uses the lazy closure of lead decision A1, §11). It is never returned by a student endpoint and never appears in a log or audit row. It is shown only to admins through the admin endpoint.
- Failure behavior (no plaintext fallback, `INTERNAL_ERROR`, the Attendance configuration scope) is as in `MASTER_ARCHITECTURE.md` §8.2 and §8.3.

### 5.2 Administrator 2FA secret: `User.twoFactor.secretEnc`
- Purpose label `admin-2fa-secret`; owner identifier: the administrator's stable `User._id`.
- Key: only `TWOFA_ENCRYPTION_KEY`. A stored value must carry that key's `keyId`; any other `keyId`, or any attendance key, is never tried.
- Present only while 2FA is enrolled; `null` otherwise. There are no recovery codes (B6).
- No previous-key variable or storage field exists for this key. Its rotation is deferred to `AUTH_AND_SECURITY.md` (batch D); until then `TWOFA_ENCRYPTION_KEY` is the only key.
- Failure behavior is as in `MASTER_ARCHITECTURE.md` §8.2 and §8.3 (the session stays awaiting 2FA and is never marked verified).

## 6. Relationships
```
User 1─* Session
User 1─* AttendanceRecord *─1 AttendanceSession *─1 Lecture
AttendanceRecord *─1 Lecture            (lectureId, copy of the session's)
User 1─* ProblemVerification *─1 Problem *─1 Topic     (one topic per problem)
User 1─* ContestResult *─1 Contest
User 1─* RatingHistory
User 1─* Notification
User 1─* ActivityEvent
User 1─* AuditLog                        (as actor)
Announcement *─1 User                    (createdBy)
AttendanceSession *─1 User               (openedBy)
```
`RateLimit` references no model (it is keyed by string). `ContestInvitation` does not exist (B11).

Integrity rules: every unique index above is the duplicate guard (attendance, verification, result, handle, slug, session token). Attendance check-in and the open-session guard use atomic writes. Restrict and reopen write the user and an `AuditLog` row in one transaction (T24, M §6.1).

## 7. Deletion (T9, `MASTER_ARCHITECTURE.md` §6.1)
**Soft deletion** applies to `Lecture`, `Contest`, `Problem`, `Announcement` and `Topic`. The only deletion metadata is `deletedAt`; who deleted is recorded in `AuditLog` (`<domain>.delete`, T24); `AuditLog` retention is not settled (B16 OPEN). No other model is deleted by the application. There is **no hard deletion and no restore endpoint** in v1 (T9, B16). The only automatic removal defined in this contract is TTL expiry of `Session` and `RateLimit` rows. B16 also names TTL on "expired challenges"; by lead decision A5 there is no challenge collection in v1, so no TTL applies to one. B16's wording in the frozen `DECISIONS.md` is unchanged (correction pending, §11).

Rules for every soft-deleted record:
- It is excluded from student and admin lists, and a lookup by id returns `NOT_FOUND`.
- Reads use a shared query helper that filters `deletedAt: null`. Middleware alone is not the enforcement (§1).
- **No cascade.** Related documents are kept and keep their references.

Effects on related records:

| Deleted | Rule | Effect on related records |
|---|---|---|
| Topic | Refused with 409 `INVALID_STATE` while it has any non-deleted problem (T9). | Its problems are already deleted and keep `topicId`. Its slug becomes reusable by a new topic (Lead B3, §4.3); the soft-deleted record is preserved. |
| Problem | Allowed. | `ProblemVerification` kept. The problem leaves lists and is excluded from raw solved and total counts (B18 raw counts only). |
| Lecture | **Refused** while any attendance session of the lecture has `closedAt: null`, including an expired one (Lead A2). The admin must close it first (`attendance.manage`, `MASTER_ARCHITECTURE.md` §7.3). Otherwise allowed. The refusal's response contract is not defined here (batch E). | `AttendanceSession` and `AttendanceRecord` are kept. Check-in is impossible because the lecture is not found. How a deleted lecture counts in an attendance percentage is OPEN (B4); the percentage is `null` in v1, so nothing depends on it. |
| Contest | Allowed. | `ContestResult` kept but hidden from students. `ActivityEvent` and `RatingHistory` are untouched. |
| Announcement | Allowed. | `Notification` rows kept. Opening the announcement returns `NOT_FOUND`. |

## 8. Details no source defines
These are **not decided here** and must be recorded by the named owner or the lead before the affected model ships.

| Item | Why it matters | Who records it |
|---|---|---|
| Handle format patterns for Codeforces and LeetCode | `User.handles` validators (A) | A4 |
| Maximum URL length for lecture resources (B13) | Resource validator | Lead or A5 |
| Cap on `Contest.fetchSummary.unmatchedHandles` | Document size | A6 |
| Notification `type` identifiers | `Notification.type` | A5, in batch F |
| B16 wording "expired challenges" | Lead decision A5: no challenge collection in v1. The frozen B16 text still names "expired challenges" until the lead approves the exact correction (§11). | Lead |
| Admin user search index (text or regex) | `User` indexes | A3 |
| Audit logging of lazy closures (Lead A1) | T24 covers admin mutations; a closure triggered by a student check-in is a system action, and no frozen decision settles whether it is logged. A closure inside an admin start may or may not be logged separately; also unsettled. | Lead |
| Rate-limit key hashing method | `RateLimit.key` | A4, in batch D |

## 9. Reconciliation with the audit and the original draft
| Source said | This contract | Why |
|---|---|---|
| Audit `User.status` includes `disabled` | Not included | B2 |
| Audit `Lecture.sessionState` | Not stored | T7, B12 |
| Audit `Session.ip` | Not stored | T19 |
| Audit: announcements may hard-delete | Soft-deleted | T9 |
| Audit `ContestInvitation` (optional) | Not created | B11 |
| Draft `AttendanceRecord` status and correction fields | Not included | T6, B4 |
| Draft: hash of the attendance code. Audit: plain `code` | `codeEnc` (AEAD) | T4 |
| Draft: scheduled announcements | Removed | T8 |
| Draft and audit: `RateLimit` optional | Required | T5, T23 |
| Audit `ContestResult.score` | `points` | B10, Lead B4 |
| Draft: separate normalized email | Single `email`, stored normalized; original casing not preserved | Lead B5 (audit rule: lowercase and trim) |
| Audit: `Topic.slug` plain unique | Unique among non-deleted topics | Lead B3 |

## 10. Carry-forward items from `DECISIONS.md` §9 handled here
| Item | Handled in this file | Remains for |
|---|---|---|
| Encryption contexts per purpose used consistently | §5 uses the §8.3 labels and owner identifiers for both fields, with purpose-bound keys | The rotation and any previous-key rule for `TWOFA_ENCRYPTION_KEY` stay with `AUTH_AND_SECURITY.md` (batch D) |
| Encryption-key handling in the attendance flow; session field list | §5.1 (attendance code storage and lifetime) and §4.2 (session fields) | The login-time rules for `twoFactorVerified` and the rate-limit hashing method stay with batch D |

## 11. Lead decisions recorded for batch C
Recorded from the lead's instruction for **batch C only**. They do **not** approve batch C as a whole, do not start batch D, E or F, and change no frozen decision: `DECISIONS.md` and `MASTER_ARCHITECTURE.md` are unchanged. Index behavior stays **UNVERIFIED** until A3 checks it against the actual MongoDB and Mongoose versions; no test, build, install or index check has been run.

| ID | Decision recorded | Where | Still open |
|---|---|---|---|
| A1 | Lazy closure in one transaction when an expired session receives a check-in, or when an admin starts the next session for that lecture: set `closedAt` to the server time of closure and clear `codeEnc`. No admin-read sweep. | §5.1, §4.7 | Whether system closures are audit-logged (§8). |
| A2 | Lecture deletion is refused while any session has `closedAt: null`, including an expired one; the admin must close it first. Attendance records are kept. No audit requirement beyond existing contracts. | §7 | The refusal's response contract (batch E). |
| A3 | Dashboard recent activity is a read-only list of recent `AuditLog` entries: action, safe summary, actor and time only, never `meta`. Existing admin dashboard permission. | §4.15 | Entry count and granular permission mapping (batch E). |
| A4 | Admin notifications view shows only six categories (announcement, lecture, contest and result publication; user restriction; user reopening). No read state or unread badge in v1. | §4.15 | Exact `domain.verb` strings once the registry exists; any filter index needs a documented, reviewed change. |
| A5 | No challenge collection in v1. | §2, §7, §8 | B16's wording (below). |
| B1 | `ActivityEvent.day` is a `YYYY-MM-DD` string. | §4.12 | The campus time zone stays subject to B17 (PROPOSED); stored values are recomputed if it changes. |
| B2 | `deletedAt` only; `AuditLog` records who deleted. | §7 | `AuditLog` retention is not settled (B16 OPEN). |
| B3 | Topic slugs are reusable after soft deletion; partial unique index among non-deleted topics; deleted records preserved. | §4.3, §7 | A3 verifies the partial filter. |
| B4 | `points` is the stored contest-result field. | §4.10 | Any official score formula (B10 OPEN). |
| B5 | One normalized `email` field; original casing not preserved. | §4.1, §9 | None. |
| C1–C4 | Unsupported citations removed (§4.8 T6, §4.3 T9). `RateLimit.key` unique and `Session {userId}` kept and labeled **derived**. The legend defines **derived**. | §4.8, §4.3, §4.16, §4.2, legend | None. |

**Provenance note (handle normalization).** The rule in §4.1 that optional handles are trimmed and that empty or whitespace-only values are stored as missing comes from the lead's batch C correction instruction. It is not from the audit and is not one of A1–C4.

**Accepted consequences of A1.** Expiry cleanup happens on access, not at the moment of expiry. Until a check-in or a next-session start triggers it, an expired session's ciphertext stays stored and an admin read of the code can still succeed. The closure must be committed even though the check-in's response is `ATTENDANCE_EXPIRED`. T4 and `MASTER_ARCHITECTURE.md` §8.3 say the code is cleared "on close/expiry"; this contract records the lead-accepted timing, and those frozen texts are not amended.

**B16 wording: authorized in principle, NOT applied.** `DECISIONS.md` is frozen and is edited only on the lead's explicit approval of the exact text. Proposed change to the B16 row, for that approval:
- Current: "TTL only on sessions, rate-limit rows and expired challenges."
- Proposed: "TTL only on sessions and rate-limit rows."
