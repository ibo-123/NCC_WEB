# API Contract

**Status: DRAFT — endpoint inventory must be reconciled against the full audit and UI prototype before feature implementation.**

## 1. General rules
- API root: `/api`
- JSON request/response unless the endpoint explicitly handles multipart uploads.
- IDs are strings to clients.
- All timestamps are ISO-8601 UTC strings.
- Authenticate from the server-validated session cookie. Never accept a user identity or role from request JSON as proof of identity.
- Validate path parameters, query parameters, and bodies with Zod.
- Unknown body fields should be rejected or stripped consistently; choose one policy in shared validation utilities and test it.
- Do not return password hashes, session-token hashes, 2FA secrets, recovery codes, private verification tokens, or internal error stacks.

## 2. Response envelope
Success:
```json
{
  "success": true,
  "data": {}
}
```

Failure:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "fields": {
      "email": "Enter a valid email address."
    }
  }
}
```

List data:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

## 3. HTTP status conventions
- `200` — successful read/update/action
- `201` — resource created
- `204` — only where an empty response is explicitly documented; otherwise preserve envelope
- `400` — malformed request or invalid query/path parameters
- `401` — no valid authenticated session
- `403` — authenticated but not permitted, or account restricted (except explicitly allowed recovery/session endpoints)
- `404` — resource not found or intentionally concealed due to access policy
- `409` — conflict, duplicate unique value, or invalid state transition
- `422` — semantically invalid input when distinct from malformed request (use consistently)
- `429` — rate limit / temporary lockout
- `500` — generic unexpected server error; no stack trace in client response
- `503` — required dependency unavailable

## 4. Standard error codes
`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_STATE`, `RATE_LIMITED`, `ACCOUNT_RESTRICTED`, `DEPENDENCY_UNAVAILABLE`, `INTERNAL_ERROR`.

## 5. Authentication and account endpoints
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public, subject to approved registration policy | Create an eligible student account |
| POST | `/auth/login` | Public, rate-limited | Verify credentials and create session |
| POST | `/auth/logout` | Session | Revoke current session |
| GET | `/auth/me` | Session | Return safe current-user profile and effective permissions/status |
| POST | `/auth/forgot-password` | Public, rate-limited; policy OPEN | Start password recovery without account enumeration |
| POST | `/auth/reset-password` | Valid one-time token; policy OPEN | Set new password and revoke other sessions |
| POST | `/auth/2fa/verify` | Admin pre-auth challenge; if 2FA flow requires it | Verify TOTP before granting admin session |
| POST | `/auth/2fa/setup` | Admin authenticated with recent re-authentication | Begin setup and return QR/secret only through protected flow |
| POST | `/auth/2fa/confirm` | Admin authenticated with setup pending | Confirm TOTP and enable 2FA |
| POST | `/auth/2fa/disable` | Admin, recent re-authentication | Disable 2FA with audit event |

The exact registration, password recovery, and 2FA flow must be reconciled with the prototype and approved policy before implementation.

## 6. Profile and user administration
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | Session | Current profile |
| PATCH | `/users/me` | Session | Update allowed profile fields only |
| PATCH | `/users/me/password` | Session, recent re-authentication | Change password |
| GET | `/admin/users` | Admin | Search/filter/paginate users |
| GET | `/admin/users/:id` | Admin | User details |
| PATCH | `/admin/users/:id` | Admin | Update explicitly permitted administrative fields |
| POST | `/admin/users/:id/restrict` | Admin, audited; policy OPEN | Apply approved restriction |
| POST | `/admin/users/:id/reopen` | Admin, audited | Reopen eligible restricted account |

Never allow ordinary profile updates to set roles, restriction state, rating, verified status, or 2FA settings.

## 7. Learning resources and problems
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/topics` | Authenticated student/admin | List visible topics |
| GET | `/topics/:id` | Authenticated student/admin | Topic detail |
| GET | `/problems` | Authenticated student/admin | Filter/search/paginate visible problems |
| GET | `/problems/:id` | Authenticated student/admin | Problem detail |
| POST | `/admin/topics` | Admin | Create topic |
| PATCH | `/admin/topics/:id` | Admin | Update topic |
| DELETE | `/admin/topics/:id` | Admin, soft delete | Soft-delete topic if supported by approved model |
| POST | `/admin/problems` | Admin | Create problem |
| PATCH | `/admin/problems/:id` | Admin | Update problem |
| DELETE | `/admin/problems/:id` | Admin, soft delete | Soft-delete problem |

The final topic hierarchy and problem verification rules must match the audited model and UI. Do not invent auto-verification behavior.

## 8. Lectures and attendance
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/lectures` | Authenticated student/admin | List visible lectures |
| GET | `/lectures/:id` | Authenticated student/admin | Lecture detail |
| POST | `/admin/lectures` | Admin | Create lecture |
| PATCH | `/admin/lectures/:id` | Admin | Update lecture |
| DELETE | `/admin/lectures/:id` | Admin, soft delete | Soft-delete lecture |
| POST | `/attendance/sessions` | Admin | Open attendance session and generate code |
| GET | `/attendance/sessions` | Admin | List/filter sessions |
| POST | `/attendance/sessions/:id/check-in` | Student session | Submit code; server determines student identity |
| GET | `/attendance/me` | Student session | Own attendance history |
| GET | `/admin/attendance/sessions/:id/records` | Admin | Session attendance records |
| PATCH | `/admin/attendance/records/:id` | Admin, audited | Correct a record with reason |

Attendance code TTL and attempt limits are configurable proposals in `DECISIONS.md`, not immutable business policy.

## 9. Contests, results, and progress
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/contests` | Authenticated student/admin | List visible contests |
| GET | `/contests/:id` | Authenticated student/admin | Contest detail |
| POST | `/admin/contests` | Admin | Create contest |
| PATCH | `/admin/contests/:id` | Admin | Update contest |
| DELETE | `/admin/contests/:id` | Admin, soft delete | Soft-delete contest |
| GET | `/contests/:id/results` | Authenticated student/admin; visibility rules OPEN | Results |
| POST | `/admin/contests/:id/results/import` | Admin | Import or submit results, validate source and duplicates |
| GET | `/progress/me` | Student session | Own progress summary |
| GET | `/leaderboard` | Authenticated student/admin; visibility rules OPEN | Ranked summary |
| GET | `/integrations/codeforces/status` | Session | Current integration/verification status |
| POST | `/integrations/codeforces/verify` | Session, rate-limited | Verify Codeforces ownership |
| GET | `/integrations/leetcode/status` | Session | Report supported/unavailable status honestly |

LeetCode verification is not promised until a supported, reliable approach is approved. Do not scrape or fabricate verification.

## 10. Announcements and notifications
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/announcements` | Authenticated student/admin | Visible announcements |
| POST | `/admin/announcements` | Admin | Create announcement |
| PATCH | `/admin/announcements/:id` | Admin | Update announcement |
| DELETE | `/admin/announcements/:id` | Admin, audited | Archive/delete according to approved policy |
| GET | `/notifications` | Session | Own notifications |
| PATCH | `/notifications/:id/read` | Owner only | Mark own notification read |
| POST | `/notifications/read-all` | Session | Mark own notifications read |

## 11. Dashboard and audit
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/dashboard` | Session | Role-appropriate dashboard aggregates |
| GET | `/admin/audit-logs` | Admin with explicit permission | Filter/paginate audit events |
| GET | `/admin/system/health` | Admin/operations policy OPEN | Safe operational health summary |

Avoid N+1 database calls for dashboard aggregates. Do not expose secrets or internal infrastructure details in health output.

## 12. Cross-cutting requirements
- All list endpoints support consistent pagination and safe filtering.
- Admin mutations create audit events with actor, action, target, timestamp, and safe metadata.
- Use service functions for cross-feature operations; do not import another feature's private internals.
- Mutating operations must be safe against duplicate submissions where applicable.
- Rate-limit login, registration, password recovery, attendance-code attempts, and external verification.
- Use transactions for multi-document updates where supported.
- A route must explicitly declare its access policy; public-by-accident is a defect.

## 13. Contract test checklist
For every endpoint, test: happy path, invalid input, unauthenticated request, wrong role, restricted account behavior where relevant, not-found resource, duplicate/conflict, rate limiting where relevant, and audit event for sensitive admin mutation.

## 14. Contract freeze checklist
Before feature implementation, the lead must:
1. Compare every endpoint against the full audit and prototype.
2. Confirm request/response schemas and route naming.
3. Confirm role/permission matrix.
4. Resolve OPEN business rules in `DECISIONS.md`.
5. Update this document and announce a contract version.
