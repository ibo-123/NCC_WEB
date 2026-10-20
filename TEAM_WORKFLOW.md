# Six-Account Team Workflow

## Team roles
- **Account 1 — Project lead (you):** owns architecture/contracts, approves business decisions, reviews PRs, integrates releases, resolves conflicts.
- **Account 2 — UI/Foundation:** design tokens, shared components, layout/theme, responsive foundation, admin dashboard shared widgets.
- **Account 3 — Database:** canonical Mongoose models, indexes, model exports, seed infrastructure, schema tests.
- **Account 4 — Authentication/Security:** sessions, auth flows, authorization helpers, admin 2FA, rate limiting and security tests.
- **Account 5 — Core Platform:** topics/problems, lectures, attendance, and related service/API implementation using shared DB/auth contracts.
- **Account 6 — Competition/Admin:** contests, results, progress/rating workflows, announcements/admin assembly and external integrations, using shared services.

The lead may reassign scope after comparing the full audit with actual workload. One canonical owner per shared module/model.

## Repository and branches
- `main` is the integrated, reviewable branch. Do not commit directly to it for feature work.
- Branch format: `feat/<area>-<short-description>`, `fix/<area>-<short-description>`, `docs/<short-description>`.
- Each account works in its own isolated branch/worktree/clone. Never have multiple accounts edit the same working tree concurrently.
- Open pull requests into `main`; include purpose, files changed, contracts used, tests/commands run, screenshots when UI changes, known limitations, and any contract changes.
- Keep PRs small and focused. Rebase/merge the latest approved `main` as directed; do not force-push shared branches.
- Only the lead merges PRs after reviewing conflicts, tests, and contract compliance.

## Shared-file ownership
- `docs/*`, shared API envelopes/errors, auth primitives, global layout/theme tokens, and cross-feature service interfaces are lead-controlled.
- Database owner owns canonical files under `models/` and schema/index changes. Feature owners must not create competing models.
- Auth owner owns `lib/auth/*` and session/permission helpers.
- UI owner owns shared components/design tokens and shared layout.
- Feature owners own their feature service/routes/pages within the agreed boundary.
- If a task requires editing another owner's files, coordinate first; request a small PR from the owner or explicit lead approval.

## Contract-first workflow
1. Lead freezes v1 contracts and publishes version/date.
2. Each account reads all docs and confirms assigned scope and dependencies.
3. Owners publish stable exports/signatures for shared modules.
4. Feature work begins only when required contracts are merged or explicitly stubbed.
5. Contract changes require a proposal and lead approval before implementation.
6. Integration uses PRs, tests, and an integration checklist.

## Parallelism and dependencies
Can start after the contracts are approved:
- UI foundation and database model scaffolding can proceed in parallel if they do not edit the same files.
- Auth implementation depends on the agreed User and Session schemas; schema interface should be published first.
- Core platform and competition/admin feature routes depend on model exports, response helpers, and auth/permission helpers.
- Final page integration depends on stable API response shapes and shared UI components.

## Definition of done
A task is done only when:
- code stays within assigned ownership
- contracts are followed
- relevant tests are added and run
- lint/build results are reported accurately
- no secrets or real personal data are committed
- errors, limitations, and unimplemented paths are documented
- PR includes integration notes and exact changed files
- lead can integrate it without reverse-engineering hidden assumptions

## Required completion report
1. Summary
2. Files created/changed
3. Public exports/signatures added
4. Endpoints/models affected
5. Tests and exact command results
6. Known issues/assumptions
7. Dependencies/blockers
8. Any requested contract change (do not silently apply it)

## Stop-and-ask conditions
Stop and report rather than guessing if:
- docs conflict
- required business policy is OPEN
- a needed endpoint/schema is missing
- another account owns the required file
- a prototype behavior is ambiguous
- a library/integration cannot be verified
