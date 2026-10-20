# Implementation Plan

## Gate 0 — Verify baseline
Owner: lead, with support from UI/Foundation account.
- Inspect repository and current branch/working tree.
- Verify `package.json`, scripts, dependencies, current Next.js version, and `.gitignore`.
- Read the full architecture audit and inspect prototype source.
- Render/inspect prototype at 1440, 1280, 768, and 390 widths, in both themes.
- Run available install/lint/build commands and record baseline failures.
**Exit criteria:** baseline report and known issues published; no claims of success without command output.

## Gate 1 — Freeze contracts
Owner: lead, with database/auth/feature owners reviewing.
- Reconcile this draft with the full audit.
- Confirm exact endpoint inventory and schemas.
- Resolve business decisions needed for the first milestone.
- Publish API envelope, error handling, permission helper signatures, model exports, pagination, and date conventions.
**Exit criteria:** contract version/date approved and shared with all accounts.

## Gate 2 — Foundation
Parallel:
- UI account: tokens, theme, shared components, responsive shell.
- DB account: connection helper review, model conventions, initial core models/indexes and tests.
- Lead: lint/build/test scripts and shared response/error contract.
**Exit criteria:** foundation PRs integrated; app builds; shared interfaces documented.

## Gate 3 — Authentication and security
- Implement registration policy as approved.
- Session lifecycle, login/logout/me, role/permission checks.
- Admin 2FA, rate limiting, audit logging primitives.
- Test restricted-account behavior and unauthorized/forbidden access.
**Exit criteria:** auth/security journeys pass tests; downstream owners use shared helpers.

## Gate 4 — Core learning workflows
- Topics and problems.
- Lectures and resources.
- Attendance sessions, check-in, records, admin corrections.
- Audit and rate-limit sensitive actions.
**Exit criteria:** complete student/admin flows tested end to end.

## Gate 5 — Competition and progress
- Contests and results.
- Progress/leaderboard aggregates.
- Rating history and configurable policy seam; no unapproved automatic restrictions.
- Codeforces integration only after verification method is confirmed; honest unsupported state for LeetCode if needed.
**Exit criteria:** core workflows tested; external dependency failure handled.

## Gate 6 — Admin and notifications
- Admin user management, content management, announcements, audit logs.
- Notifications and dashboard aggregates.
- Reuse feature services; no duplicate business logic in admin routes.
**Exit criteria:** admin workflows use the same validated services and permissions.

## Gate 7 — Integration and release readiness
- Complete critical Playwright journeys.
- Test desktop/mobile and dark/light themes.
- Run lint, tests, production build.
- Verify environment configuration, indexes, backups, and deployment instructions.
- Resolve security/privacy issues before release.
**Exit criteria:** lead signs off release checklist.

## Suggested critical journeys
1. Approved student registration → login → `/auth/me` → logout.
2. Invalid login throttled without account enumeration.
3. Student cannot access admin endpoints.
4. Student browses topics/problems and lectures.
5. Student checks in with a valid attendance code; duplicate and brute-force attempts are rejected.
6. Admin creates/updates/archives learning content.
7. Admin creates contest and imports/updates results.
8. Progress/leaderboard reflect approved calculation rules.
9. Admin restriction/reopening is authorized, audited, and follows approved policy.
10. Admin enrolls and verifies TOTP 2FA.
11. Notifications are visible/read only by their recipient.
12. API and UI behave correctly for expired sessions and unavailable external integrations.
