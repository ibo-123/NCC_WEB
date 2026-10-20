# Decisions and Open Questions

This file is the record of approved product/technical decisions. Change it only after the project lead confirms the decision. Mark each item `APPROVED`, `PROPOSED`, or `OPEN`.

## Approved technical baseline
- **APPROVED:** Next.js 15 App Router, React 19, JavaScript, Tailwind CSS v4, MongoDB Atlas, Mongoose, Zod.
- **APPROVED:** Server-side sessions using opaque tokens stored as hashes; HttpOnly cookies.
- **APPROVED:** bcryptjs password hashing.
- **APPROVED:** Preserve prototype styling/tokens; dark theme default and theme toggle.
- **APPROVED:** Vitest and Playwright as intended test tools.
- **APPROVED:** Soft-delete lectures, contests, and problems unless a specific case is approved otherwise.
- **APPROVED:** Short-lived feature branches and pull requests; lead integrates to main.
- **PROPOSED:** `Africa/Addis_Ababa` as campus timezone; NCC owner must confirm.
- **PROPOSED:** Initial responsive breakpoints 1100px, 800px, 420px; verify against rendered prototype.
- **PROPOSED:** MongoDB-backed rate limiting.

## Business decisions — unresolved
1. **Rating formula and weights — OPEN.** Prototype examples do not reveal a consistent formula. Do not hard-code an inferred formula.
2. **Restriction threshold and automation — OPEN.** Keep thresholds configurable; do not automatically restrict accounts until the NCC lead approves the rule. Admin restriction/reopening must be authorized and audited.
3. **Registration policy — OPEN.** Confirm whether registration is invite-only, institutional email/allowlist, admin-created, or open. Do not assume unrestricted public signup.
4. **Attendance expiry and attempts — PROPOSED.** 10-minute code expiry and five failed attempts per student/session, with temporary lockout. NCC owner to approve.
5. **Qualifying activity/streak rules — OPEN.** Define qualifying actions, local day boundary, timezone, and treatment of missed days before using streaks in ratings/standing.
6. **Admin 2FA recovery — OPEN.** Confirm recovery codes, lost-device process, and who can reset admin 2FA.
7. **LeetCode integration — OPEN.** Implement only a reliable, supportable verification flow. Show unavailable/unconfigured state otherwise.
8. **Codeforces verification — OPEN.** Confirm verification method and acceptable evidence.
9. **Contest result imports — OPEN.** Confirm accepted sources, manual overrides, duplicate handling, and edit permissions.
10. **User restriction semantics — OPEN.** Specify exactly which reads/mutations are blocked and which auth/recovery routes remain available.
11. **Resource hosting — PROPOSED.** Use external URLs for v1 rather than implementing file uploads; confirm accepted URL types and access control.
12. **Student identity verification — OPEN.** Confirm required fields and who can approve/verify accounts.
13. **Admin permission model — OPEN.** Confirm whether all admins have equal permissions or whether granular permissions are required.
14. **Notifications — OPEN.** Confirm in-app only or email/push requirements.
15. **Retention and privacy — OPEN.** Confirm retention rules for attendance, audit logs, account deletion, and external verification evidence.

## Decision process
Each decision must record:
- question and options
- selected option and rationale
- decision owner and date
- documents/endpoints/models affected
- migration or compatibility impact

Until resolved, implementation must use a configurable seam or report a blocker. Do not silently choose a business policy.
