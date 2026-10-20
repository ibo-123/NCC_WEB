# Authentication and Security Contract

## Identity and sessions
- Use server-side sessions with cryptographically secure opaque random tokens.
- Send the raw session token only in an HttpOnly cookie; store only a cryptographic hash of the token in MongoDB.
- Cookie settings: `HttpOnly`, `Secure` in production, appropriate `SameSite`, narrow path, and bounded expiry.
- Rotate session after login and privilege changes. Revoke sessions on logout, password reset, account restriction, and other approved security events.
- Validate session existence, expiry, revocation, and user status on the server for each protected request.
- Never accept `userId`, role, or permission supplied by the browser as authenticated identity.
- Keep authentication helpers centralized; route handlers must not invent their own session parsing.

## Passwords
- Use `bcryptjs` with a cost factor selected and documented for the deployment environment.
- Enforce minimum password policy consistently; do not invent complex rules without product approval.
- Login and recovery responses must avoid account enumeration.
- Rate-limit login, registration, and password recovery.
- Password changes/recovery should revoke other sessions according to the approved flow.

## Authorization
Initial roles are proposed as `student` and `admin`; confirm against the audit and product requirements.
- Deny by default.
- Every route must declare access requirements.
- Enforce role and resource ownership on the server.
- A student may access only their own private profile, attendance history, notifications, progress, and verification status.
- Admin endpoints require a valid admin session and the appropriate permission.
- Account restriction behavior must be applied server-side and must not block explicitly permitted recovery, logout, or `/auth/me` routes.
- UI hiding is not access control.

## Admin two-factor authentication
- TOTP is required for admin accounts because the prototype includes it, pending confirmation of exact enrollment/recovery flow.
- Encrypt TOTP secrets at rest using an application secret supplied via environment configuration.
- Never log or return stored secrets after enrollment.
- Require confirmation code before enabling 2FA.
- Require recent re-authentication for disabling 2FA or other sensitive changes.
- Recovery codes, if included, must be random, shown once, stored hashed, and rate-limited.
- QR code/setup data must be available only to the authenticated admin during enrollment.
- Document deployment secret rotation and backup expectations.

## Attendance codes
- Codes are short-lived and must be validated server-side.
- Proposed initial configuration: 10-minute expiry and maximum five failed attempts per student/session, with temporary lockout and rate limiting. These values remain configurable until approved.
- Never expose raw codes in logs.
- Prevent duplicate attendance records with a database uniqueness constraint.
- Admin corrections require a reason and audit event.

## Validation and database safety
- Validate params, query strings, and request bodies with Zod.
- Validate ObjectId format before database queries.
- Use explicit field allowlists for updates; do not spread arbitrary request bodies into Mongoose updates.
- Prevent mass assignment of roles, restriction status, ratings, 2FA state, and ownership fields.
- Use safe query construction; never pass untrusted objects directly as MongoDB filters.
- Handle duplicate-key errors and validation errors through the shared error contract.
- Use transactions for coupled writes when supported by the deployment.

## Rate limiting and abuse controls
Apply server-side rate limits to:
- login, registration, password recovery/reset
- attendance-code attempts
- external account verification
- admin 2FA challenges
- any expensive or sensitive endpoint
Use atomic storage and return `429 RATE_LIMITED`. In-memory-only rate limiting is insufficient for multi-instance deployment. MongoDB-backed limits are the initial proposal; revisit if operational requirements change.

## Audit logging
Audit sensitive administrative actions, including user restriction/reopening, role changes, attendance corrections, 2FA changes, content deletion/archive, result imports, and rating adjustments.
Logs should include actor, action, target, timestamp, and safe context. Never log credentials, tokens, raw attendance codes, or 2FA secrets.

## External integrations
- Codeforces may be implemented first if a reliable supported verification flow is confirmed.
- LeetCode support must be represented honestly; do not scrape, claim verification without evidence, or fabricate status.
- Apply timeouts, bounded retries, rate limits, and clear dependency-unavailable errors.
- Never store external account passwords.

## Configuration and deployment
- Secrets live only in environment variables/secret management, never committed.
- Keep `.env*` out of Git except a sanitized `.env.example`.
- Validate required environment variables at startup.
- Production errors must not reveal stack traces or database details.
- Use HTTPS in production and configure trusted origins/CSRF protections appropriate to cookie-authenticated mutation endpoints.
- Establish backups, restore procedure, and migration/index-change procedure before production use.
