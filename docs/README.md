# NCC DSA Platform

Next.js 15 (App Router, JavaScript), React 19, Tailwind CSS v4, MongoDB (Mongoose), Zod, opaque server-side sessions. The engineering contracts for the six-account Claude team are in `docs/`.

## Documents
| Document | Status |
|---|---|
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Frozen. Decision authority: approved decisions, OPEN items, NCC approvals, launch blockers |
| [`docs/MASTER_ARCHITECTURE.md`](docs/MASTER_ARCHITECTURE.md) | Frozen. Architecture authority: stack, layout, conventions, error registry, permission catalog, configuration |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Revision 3. Formal approval pending. Indexes UNVERIFIED |
| [`docs/AUTH_AND_SECURITY.md`](docs/AUTH_AND_SECURITY.md) | Draft. PROPOSED values (S-1 to S-8) not approved |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Draft. Some responses BLOCKED |
| [`docs/SERVICES.md`](docs/SERVICES.md) | Draft. Service signatures between accounts |
| [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md) | Draft. Six-account ownership and workflow |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Draft. Gates and release blockers |
| [`docs/audit/NCC_DSA-architecture.md`](docs/audit/NCC_DSA-architecture.md) | Historical audit (against `e4418cc`), with a status banner |

Decision traceability lives in `docs/DECISIONS.md` (T1 to T24, B1 to B21, LA, LB).

## Authority and change control
- `docs/DECISIONS.md` and `docs/MASTER_ARCHITECTURE.md` are frozen. Reopen them only for a concrete critical defect or an implementation-blocking contradiction.
- If documents conflict, stop and report it to the project lead. Do not choose silently.
- Only the lead approves contract changes. Items marked `OPEN`, `PENDING`, `PROPOSED`, `BLOCKED` or `UNVERIFIED` are not final policy; build the named seam only.
- Do not commit secrets, `.env` files, real personal data or production credentials.

## Current status
- The `app/` folder is still the create-next-app starter. No feature code exists.
- The repository is at `851c94f`. The audit was written against `e4418cc`; the commits since changed only documentation.
- The documents above are written for a `docs/` folder. The repository itself still holds the original drafts at its root; nothing has been moved, committed or pushed.
- The prototype in `design-reference/design/` was read as source and has **not** been rendered.
- No install, lint, build, test or index check has been run for any of this work.

## Remaining blockers
- **Needed before implementation starts:** formal approval of `docs/DATABASE_SCHEMA.md`; the Node range and dependency list (`docs/MASTER_ARCHITECTURE.md` §3); approval of `docs/AUTH_AND_SECURITY.md`, `docs/API_CONTRACT.md` and `docs/SERVICES.md`.
- **Open lead decisions:** LA-1 to LA-5 (`docs/DECISIONS.md` §4.1) and S-1 to S-8 (`docs/AUTH_AND_SECURITY.md` §12). Five response contracts stay BLOCKED until LA-3.
- **NCC approvals:** listed in `docs/DECISIONS.md` §6.
- **Launch blockers LB-1 to LB-4:** `docs/DECISIONS.md` §8 and `docs/IMPLEMENTATION_PLAN.md` Gate 7.
