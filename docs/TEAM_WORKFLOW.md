# Six-Account Team Workflow

**Contract revision:** Phase 3, batch 3 (draft for lead review). Owner: A1. Ownership follows the approved L1 table in `DECISIONS.md` §2; where this file differs from a frozen document, the frozen document wins. Status words are defined in `DECISIONS.md` §1. Nothing here claims a command, build or test has run; none has.

## 1. Accounts and ownership (L1, APPROVED)
| Account | Role | Domains |
|---|---|---|
| A1 | Lead | Decisions, contracts, reviews, merges, dependency approval, release sign-off |
| A2 | UI/Foundation | Tokens, theme, shared components, shells, `lib/http`, `lib/config`, `lib/validation`, configuration files, CI |
| A3 | Database | Connection helper, all models and indexes, seed and maintenance scripts, schema tests, `audit()`, `notify()`, `recordActivity()` helpers |
| A4 | Auth/Security | Sessions, permissions map, `PUBLIC_ROUTES`, rate limiting, AEAD helper, CSRF check, 2FA, profile and handles, restriction enforcement, admin users |
| A5 | Learning | Announcements, lectures, attendance, notifications, student dashboard, with their admin screens |
| A6 | Competition | Topics, problems, progress, solve check, contests, results, rating, streak, Codeforces client, with their admin screens |

Each admin screen and admin route belongs to the account that owns its domain. The lead may reassign scope; every reassignment is recorded here first.

## 2. Single-owner map for every shared path
No two accounts own the same file. If a change touches another owner's file, ask that owner for a small pull request (PR) or get A1's explicit approval. Assignments marked **confirmed by A1** were not fixed by L1 and were confirmed by the lead.

| Path | Owner | Rule |
|---|---|---|
| `package.json`, `package-lock.json` | **A2** | Edited only by A2. A new dependency needs an A1-approved request (`MASTER_ARCHITECTURE.md` §3). Feature owners ask; A2 applies in a PR. |
| `.env.example` | A2 | Placeholders only. A variable not in `MASTER_ARCHITECTURE.md` §8.1 needs A1 approval first. |
| `.gitignore`, `next.config.mjs`, `jsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, test-runner configs (Vitest, Playwright) | A2 | |
| `.github/workflows/*` (CI) | A2 | Reports only what it actually runs. |
| `app/layout.js`, `app/globals.css`, `app/page.js`, `public/` | A2 | |
| `middleware.js` | A4 (confirmed by A1) | Cookie-presence check only (`MASTER_ARCHITECTURE.md` §5). |
| `components/ui`, `components/layout` | A2 | |
| `components/<feature>` | Feature owner | Under the owner's domain. |
| `app/api/**` handlers | Domain owner | Thin; each handler declares one permission or a `PUBLIC_ROUTES` entry. |
| `app/(…)` pages | Domain owner | Auth, restricted and 2FA pages A4; admin users A4. |
| `lib/http/`, `lib/config/`, `lib/validation/` | A2 | |
| `lib/auth/` (incl. `permissions.js`, `PUBLIC_ROUTES`), `lib/security/` | A4 | A2's `withApi` calls A4's access resolver through an agreed interface. |
| `lib/db/`, `models/`, `scripts/seed`, maintenance scripts | A3 | Includes the session-revocation and 2FA re-encryption scripts (`AUTH_AND_SECURITY.md`). |
| `lib/services/<domain>/` | Domain owner | Auth and users A4; announcements, lectures, attendance, notifications, student dashboard A5; topics, problems, progress, contests, results, rating, streak A6. |
| Admin dashboard route and service (`GET /api/admin/dashboard`) | A5 (confirmed by A1) | L1 does not assign it. |
| Admin audit-log route and page | A4 (confirmed by A1) | Read-only over A3's `AuditLog`. |
| `lib/integrations/` | A6 | Codeforces client. |
| `tests/<area>` | Owner of the code under test | Auth tests A4; schema tests A3. |
| `docs/`, `README.md`, `design-reference/` | A1 | Contract documents are changed only by A1. `DECISIONS.md` and `MASTER_ARCHITECTURE.md` are frozen. |

## 3. Repository and branches
- `main` is the integrated, reviewable branch. No direct commits for feature work.
- Branches: `feat/<area>-<short-description>`, `fix/<area>-<short-description>`, `docs/<short-description>`.
- Each account works in its own isolated branch, worktree or clone. Never edit the same working tree from two accounts.
- PRs go to `main` and include purpose, exact files changed, contracts used, commands actually run and their results, screenshots for UI, known limitations and any requested contract change.
- Keep PRs small. Do not force-push shared branches. Only A1 merges.
- No commit, push, install or build is performed unless it is part of the assigned task.

## 4. Contract-first workflow
1. A1 freezes each contract and records its version. Today `DECISIONS.md` and `MASTER_ARCHITECTURE.md` are frozen; `DATABASE_SCHEMA.md` awaits formal approval; `AUTH_AND_SECURITY.md`, `API_CONTRACT.md` and this file are drafts.
2. Each account reads all documents and confirms its scope and dependencies.
3. Owners publish stable exports and signatures before dependents use them: A3 the model exports; A2 the `withApi` shell and access interface; A4 the permission resolver.
4. Work that depends on an unpublished contract uses an explicit stub, marked as such in the PR.
5. A contract change needs a written proposal and A1's approval before implementation.
6. Anything marked OPEN, PENDING, BLOCKED or UNVERIFIED is not built as if decided. Build the seam named in `DECISIONS.md`, or stop and report.

## 5. First task, dependencies and boundaries
| Account | First task | Depends on | Must not touch |
|---|---|---|---|
| A1 | Approve Batch C, the Node range and the dependency list; decide LA-1 to LA-5 and the S-values | none | application code |
| A2 | `lib/config/env.js` with the failure scopes of `MASTER_ARCHITECTURE.md` §8.2; `lib/http` (envelope, registry errors, pagination, `withApi` shell with an access interface); `lib/validation`; configs, CI, test setup; token, theme and shared-component foundation | Node and dependency approval | models, `lib/auth`, domain services |
| A3 | `lib/db/connect.js`; all 16 models and indexes from `DATABASE_SCHEMA.md`; seed script; schema tests on a replica set; the three helpers; publish exports first | Batch C approval; test-tooling approval | auth logic, routes, UI |
| A4 | `lib/security` (AEAD, rate limit, CSRF check), sessions, `permissions.js`, auth routes and pages, restriction enforcement, 2FA behind its flag, route-coverage check | A3 models; A2 `withApi` interface; approval of `AUTH_AND_SECURITY.md` and the S-values | other domains' services |
| A5 | Announcements, lectures, attendance, notifications, student dashboard, with admin screens | A3 exports; A4 helpers; A2 shared UI; `SERVICES.md` | `models/`, `lib/auth`, A6 domains |
| A6 | Topics, problems, progress, solve check, contests, results, rating, streak, Codeforces client, with admin screens | same as A5 | `models/`, `lib/auth`, A5 domains |

## 6. Parallelism
- **Can start now, in parallel, on disjoint files:** A2 and A3, once A1 approves Batch C and the Node and dependency list.
- **A4** starts the security core after its document is approved. **A5 and A6** start after `API_CONTRACT.md` and `SERVICES.md` are approved and A3's exports and A2's `withApi` are merged or stubbed.
- Final page integration waits for stable response shapes and shared UI components.

## 7. Definition of done
A task is done only when it stays within its ownership, follows the contracts, has relevant tests that were run, reports lint and build results accurately, commits no secret or real personal data, documents limitations and unimplemented paths, and lets A1 integrate it without guessing hidden assumptions.

## 8. Required completion report
1. Summary. 2. Files created or changed. 3. Public exports and signatures added. 4. Endpoints and models affected. 5. Tests and the exact command output. 6. Known issues and assumptions. 7. Dependencies and blockers. 8. Any requested contract change (never applied silently).

## 9. Stop and ask
Stop and report instead of guessing when documents conflict, a business policy is OPEN, a needed endpoint or schema is missing, another account owns the file, a prototype behavior is ambiguous, or a library or integration cannot be verified. A BLOCKED response contract is never replaced by a temporary one.
