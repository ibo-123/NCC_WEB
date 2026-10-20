# Database Schema Contract

**Status: DRAFT.** The model inventory is based on the architecture audit summary. Field-level definitions must be reconciled against the full audit and prototype before implementation.

## Shared rules
- MongoDB + Mongoose; JavaScript.
- Use timestamps (`createdAt`, `updatedAt`) consistently unless a documented reason requires otherwise.
- Store dates as UTC `Date` values; serialize as ISO-8601.
- Use ObjectId references for relations. Validate incoming IDs before querying.
- Never expose internal security fields in API serializers.
- Define indexes in model code and review index changes for production impact.
- Soft-deleted records must include consistent deletion metadata, e.g. `deletedAt` and optionally `deletedBy`; do not mix hard and soft deletion silently.
- Avoid duplicating derived values unless there is a documented consistency strategy.

## Model inventory and ownership
| Model | Primary owner | Purpose |
|---|---|---|
| User | Auth/DB owner with lead approval | Identity, profile, role, status |
| Session | Auth/DB owner | Hashed session token, expiry, revocation |
| Topic | Learning owner | Learning topic/category |
| Problem | Learning owner | Problem metadata and verification state |
| ProblemVerification | Learning/integration owner | Evidence and verification attempts |
| Lecture | Learning owner | Lecture metadata/resources |
| AttendanceSession | Learning owner | Time-bounded session and code hash/metadata |
| AttendanceRecord | Learning owner | One student's attendance result per session |
| Contest | Competition owner | Contest metadata and schedule |
| ContestResult | Competition owner | Student result/source data |
| RatingHistory | Competition owner, business rules pending | Auditable rating changes |
| ActivityEvent | Shared service owner assigned by lead | Qualifying user activity events |
| Announcement | Admin owner | Announcements and publication status |
| Notification | Shared notification owner assigned by lead | Per-user notifications |
| AuditLog | Security/shared owner assigned by lead | Security/admin mutation history |
| RateLimit (optional) | Security owner | Durable rate-limit counters/locks |

## Required model expectations

### User
Expected conceptual fields (exact names/types must be finalized before coding):
- identity: name/display name, email, normalized email
- password hash
- role enum (initial proposal: `student`, `admin`)
- account status / restriction state
- profile fields supported by the product
- 2FA enabled flag and encrypted TOTP secret metadata for admins
- timestamps and deletion/archive fields if needed

Constraints:
- normalized email unique index
- password hash never returned by API
- role/status changes restricted to authorized admin services and audited
- never trust client-supplied role or rating

### Session
- user reference
- hashed opaque token (unique index)
- created/last-used/expiry/revocation timestamps
- safe metadata such as user-agent summary only if justified; avoid excessive fingerprinting
- TTL index may be used for expiry cleanup, but application validation must still reject expired/revoked sessions

### Topic
- title/slug and description
- ordering/visibility
- optional parent reference only if hierarchy exists in approved design
- deletion/archive metadata

### Problem
- title/slug, statement or external URL, difficulty/category, topic references
- visibility and verification state
- source/platform metadata when relevant
- deletion/archive metadata

### ProblemVerification
- user/problem references
- source and evidence metadata
- status and review timestamps
- rate-limit/audit-relevant metadata
- do not store third-party credentials

### Lecture
- title, description, scheduled/published metadata, resource URLs
- visibility/order
- deletion/archive metadata
- store URLs rather than uploaded files for v1 unless approved otherwise

### AttendanceSession
- lecture or event reference if required by approved UI
- start/end/expiry timestamps
- hash of attendance code rather than reusable plaintext where feasible
- status, creator reference, attempt-policy configuration if per-session
- unique/session constraints to prevent duplicate sessions where needed

### AttendanceRecord
- attendance-session reference and student reference
- status and check-in timestamp
- correction metadata/reason for admin edits
- unique compound index on session + student to prevent duplicate check-ins

### Contest
- title, description, source, start/end, visibility/status
- resource URL and deletion/archive metadata

### ContestResult
- contest and user references
- source result identifiers, score/rank/solved counts as appropriate
- import provenance and timestamps
- unique compound constraint on contest + user when product rules require one result per user

### RatingHistory
- user reference, previous/new rating, reason/source, actor/system source, timestamp
- formula/version metadata when a rating rule is approved
- no automatic restriction based on rating until business rule is approved

### ActivityEvent
- user reference, event type, occurredAt, source/reference metadata
- event types and qualifying rules must be centrally defined
- avoid accepting client-submitted events as authoritative without server validation

### Announcement
- title/body, publication status and schedule, creator/updater references
- created/updated/published timestamps
- archive metadata

### Notification
- recipient user reference, type, safe payload/reference, read timestamp
- index by recipient + createdAt and recipient + read status as needed

### AuditLog
- actor, action, target type/id, timestamp, request/correlation ID where available
- safe metadata only; never record passwords, session tokens, TOTP secrets, recovery tokens, or raw attendance codes
- append-only from application perspective; ordinary admins must not edit/delete logs

### RateLimit (optional)
- key scope, hashed or non-sensitive subject identifier, count/window/lockout timestamps
- avoid storing raw passwords or raw sensitive tokens
- use atomic updates to avoid race conditions

## Relationships
- User → Session: one-to-many
- User → AttendanceRecord: one-to-many
- AttendanceSession → AttendanceRecord: one-to-many
- Topic → Problem: one-to-many or many-to-many only as approved
- User → ContestResult: one-to-many
- Contest → ContestResult: one-to-many
- User → RatingHistory: one-to-many
- User → Notification: one-to-many
- User → ActivityEvent: one-to-many
- User/admin actor → AuditLog: references where available

## Model implementation rules
- Keep one canonical Mongoose model per collection. Use the established hot-reload-safe model reuse pattern.
- Keep schema validation, request validation, and business validation distinct; all are needed.
- Do not use Mongoose middleware as the only enforcement for critical authorization or workflow rules.
- Do not let UI accounts independently create conflicting copies of shared models.
- DB/schema owner must publish model exports and service signatures before feature owners depend on them.
- Any schema change after contract freeze requires a documented proposal, impact analysis, and lead approval.
