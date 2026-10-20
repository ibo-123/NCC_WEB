# Master Architecture

## 1. Product
NCC DSA Platform supports student accounts, learning resources, problems, attendance, contests, progress/rating workflows, notifications, and administrator workflows. The UI prototype in `design-reference/design` is the visual/product reference. It contains both real routes and interaction states; do not treat every prototype state as a separate URL.

## 2. Approved technical baseline
- Next.js 15 App Router
- React 19
- JavaScript (not TypeScript)
- Tailwind CSS v4, preserving prototype CSS variables and styling
- MongoDB Atlas + Mongoose
- Zod for request validation
- `lucide-react` plus prototype custom icons where needed
- Server-side sessions with opaque random tokens; only token hashes stored in the database
- `bcryptjs` for password hashing
- Vitest for unit/service tests; Playwright for critical browser journeys
- Dark theme as default, with a visible theme toggle and persisted preference
- Timezone proposal: `Africa/Addis_Ababa`, pending NCC owner confirmation

Do not replace the stack with TypeScript, Prisma, PostgreSQL, or a separate Express server unless the lead approves an architecture change.

## 3. Architectural boundaries
Use App Router route handlers for HTTP entry points and keep business logic in service modules.

Suggested structure (adapt to existing repo only after inspecting it):
- `app/` — routes, layouts, pages, API route handlers
- `components/` — shared UI and feature UI
- `lib/db/` — MongoDB connection and database helpers
- `lib/auth/` — session creation/validation, password and permission helpers
- `lib/validation/` — shared Zod schemas
- `lib/services/` — business rules and transactional operations
- `lib/http/` — response envelope, errors, pagination helpers
- `models/` — Mongoose models
- `tests/` — unit, integration, and E2E tests
- `scripts/` — development-only seed and maintenance scripts
- `docs/` — contracts and team coordination

Do not reorganize the repository wholesale without the lead's approval. The existing repository may dictate a more appropriate exact structure.

## 4. Request lifecycle
1. Route handler parses request and authenticates session where required.
2. Authorization helper verifies role and resource-level access.
3. Zod validates input and strips/rejects unexpected fields.
4. Service applies business rules and performs database operations.
5. Route handler returns the standard response envelope.
6. Security-relevant mutations write an audit event.
7. Tests cover success, validation failures, unauthenticated access, forbidden access, and relevant concurrency cases.

Route handlers must not contain large blocks of business logic. Do not duplicate business rules across UI and API. The server is authoritative.

## 5. Shared conventions
- JSON API base: `/api`
- IDs exposed to clients: string representation of MongoDB ObjectIds.
- Dates: ISO-8601 strings in JSON; store timestamps as UTC dates.
- Pagination: `page` (1-based) and `limit` (default 20; max 100) unless an endpoint documents cursor pagination.
- List response: `{ items, pagination: { page, limit, total, totalPages } }`.
- API envelope and errors: see `API_CONTRACT.md`.
- Status values must be defined centrally and reused. Do not invent spelling variants.
- Prefer soft deletion for lectures, contests, and problems. Exclude deleted records from normal reads; audit destructive/admin actions.
- Use database indexes for frequently queried fields and unique constraints where specified.
- Never trust client-supplied user IDs, roles, rating values, attendance status, or ownership.
- Use transactions for multi-document operations where MongoDB deployment supports them; define a safe fallback only with lead approval.

## 6. UI fidelity
- Inspect and render the prototype before implementation.
- Preserve CSS tokens, spacing, typography, dark/light behavior, and custom icon style.
- Validate at 1440, 1280, 768, and 390 CSS pixels.
- Proposed viewport breakpoints: 1100px, 800px, 420px; validate rather than blindly applying.
- Build shared components before individual pages. Do not create duplicate buttons, dialogs, tables, toasts, form controls, or theme logic.

## 7. Security baseline
See `AUTH_AND_SECURITY.md`. Security must be enforced server-side. Hiding UI controls is not authorization.

## 8. Quality gates
Before marking a task complete:
- Run relevant lint, build, and tests available in the repository.
- Add tests for business logic and authorization.
- Check mobile and desktop behavior for UI work.
- Report exact commands and results; never claim a command passed if it was not run.
- Do not conceal existing failures. Distinguish new failures from baseline failures.
