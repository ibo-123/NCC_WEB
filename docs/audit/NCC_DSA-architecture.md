> **Status banner (added in Phase 3; the audit text below is unchanged).**
> This is **historical input**, written against commit `e4418cc`. The repository is now at `851c94f`; that change touched only documentation, so the audit's facts about `app/` and the prototype still hold. Nothing has been re-audited, rendered or run since.
> Where this audit differs from `docs/DECISIONS.md`, `docs/MASTER_ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_CONTRACT.md` or `docs/AUTH_AND_SECURITY.md`, **those documents win**. Known superseded items: the five-developer matrix (§7; see `docs/TEAM_WORKFLOW.md`), the `pageSize` pagination shape (§6.1), the `sessionState` and `disabled` fields, announcement hard delete, the 2FA verify path, the `ContestInvitation` model and the `score` field name.
> Its open questions (§10) are tracked in `docs/DECISIONS.md`.

---

# NCC_DSA Platform — Milestone 1: Repository and Prototype Audit

Status: **proposal for lead approval. No feature code has been written.**
Audited commit: `e4418cc` ("delete duplicated folder") of `ibo-123/NCC_WEB`.

---

## 0. What was and was not inspected

**Inspected (read in full, line by line)**
- Repo root: `package.json`, `README.md`, `.env.example`, `.gitignore`, `jsconfig.json`, `next.config.mjs`, `app/layout.js`, `app/page.js`, `app/globals.css`, file listing (`git ls-files`).
- Prototype (`design-reference/design/`): `index.html`, `css/app.css` (457 lines), `js/data.js`, `js/ui.js`, `js/main.js`, `js/screens-system.js`, `js/screens-auth.js`, `js/screens-user.js`, `js/screens-learn.js`, `js/screens-admin.js`.
- Screen count was machine-verified: 116 registered screens (admin 48, learn 31, user 14, system 12, auth 11), no duplicate ids.

**NOT inspected / not verified**
- The prototype was **read as source, never rendered**. I have not seen it in a browser, so pixel-level proportions, font rendering and the 1440/1280/768/390 layouts are inferred from CSS, not observed.
- `NCC_WEB-main.zip` itself: I used the copy committed in `design-reference/`. I did not diff it against the zip.
- `npm install`, `npm run build`, `npm run lint` were **not run**. Dependency versions in `package.json` (e.g. `lucide-react ^1.57.0`, `mongoose ^9.11.2`, `zod ^4.6.7`) were not checked against the registry.
- No MongoDB deployment, no Codeforces or LeetCode API was contacted. Every statement about those APIs below is a design assumption to verify during Milestone 4.
- GitHub settings (branch protection, collaborators, Actions) cannot be seen from a read-only clone. The clone is shallow (1 commit), so there is no history to review.
- Google Fonts were not loaded; IBM Plex availability via `next/font/google` is assumed.

---

## 1. Repository state

| Item | Finding |
|---|---|
| Framework | Next.js `^15.5.28`, React `19.1.0`, App Router, JavaScript, `@/*` alias (`jsconfig.json`) |
| Styling | Tailwind v4 (`@tailwindcss/postcss`), but `globals.css` and `layout.js` are still **create-next-app defaults** (Geist fonts, `prefers-color-scheme` colors, "Create Next App" metadata) |
| Dependencies present | `mongoose`, `zod`, `lucide-react`, `next`, `react`, `react-dom` |
| Dependencies **absent** | password hashing, session/auth library, TOTP/QR, rate limiting, test runner, `server-only`, date library |
| `app/` | only `layout.js`, `page.js` (starter page), `globals.css`, `favicon.ico`. No routes, no `api/`, no `components/`, `lib/`, `models/` |
| `.env.example` | `MONGODB_URI`, `SESSION_SECRET`, `APP_URL`. Enough for DB + signed sessions only |
| `.gitignore` | ignores `.env*` except `.env.example`; fine |
| README | still the create-next-app README |
| CI / tests / lint config | `eslint.config.mjs` exists; no tests, no CI workflow |

Implication: Milestone 2 starts from an essentially empty app. Nothing existing needs to be preserved except the dependency set and `.env.example`.

---

## 2. Screen and state inventory

### 2.1 Reading the 116 "screens"

The prototype is a viewer: every **state** is its own "screen". Only ~40 are real routes. The rest are states of a route (loading, empty, error, success), modals, toasts, or spec-sheet pages that are not part of the product. The map below says which is which.

Legend: **R** = route, **S** = state of a route, **M** = modal/drawer/toast, **X** = specification page, do not build.

### 2.2 Specification-only pages (X) — 8 + viewer chrome

`cover`, `foundations`, `components`, `responsive`, `user-flow`, `admin-flow`, `prototype`, `states` (state index). Also the viewer shell (left nav, width and theme switcher). These define tokens, components and flows; none is a product screen. `mobile-nav` is not a page either: it is the app shell with the drawer open (S of every page).

### 2.3 Authentication (11)

| Prototype id | Kind | Target | Notes |
|---|---|---|---|
| `login` | R | `/login` | email, password (show/hide toggle), "Create an account" link |
| `login-error` | S | `/login` | danger callout "Invalid credentials" |
| `login-loading` | S | `/login` | fields disabled, button spinner "Signing in" |
| `login-server` | S | `/login` | danger callout "Something went wrong" |
| `admin-login` | S | `/login` | **same screen**; admin lands on `/admin/dashboard` after a server-side role check |
| `register` | R | `/register` | name, email, password, confirm |
| `register-invalid` | S | `/register` | per-field errors: name required, valid email, ≥8 chars, passwords match; submit disabled |
| `register-exists` | S | `/register` | email-exists field error + "Log in instead" |
| `register-success` | S | `/register` (or `/login?registered=1`) | "Account created" badge, button to login (no auto-login) |
| `session-expired` | S | `/login?reason=expired` | status panel |
| `unauthorized` | S | `/login?reason=required` | status panel |

Auth layout: two-column, brand panel left (`--brand-panel`, headline "Practice. Compete. Keep the record.", mono metrics block), form card right (max 420px). At ≤800px the headline and metrics hide, brand panel shrinks to the logo.

### 2.4 Student shell and dashboard (4 + shell)

| id | Kind | Target |
|---|---|---|
| `dashboard` | R | `/dashboard` — rating card (value /5.00, stars, delta), streak card, three mini stats (attendance, solved, contests), upcoming lectures, upcoming contests, announcements (3), recent activity timeline |
| `dashboard-loading` | S | skeleton variant (title, 3 cards, 3 lines) |
| `notifications` | R | `/notifications` — list: type, text, "Open" link |
| `streak` | R | `/streak` — current/longest + 18-week × 7-day activity calendar with legend. Sidebar highlights **Dashboard**, so it is a child of dashboard |

Student sidebar (9 items, one group, no section titles): Dashboard, Announcements, Lectures, Attendance, Contests, Results, Progress, Rating, Profile. Footer: identity block (avatar initials, name, "Rating 4.27"), Log out. Topbar: breadcrumbs, bell (→ notifications), user chip (→ profile).

### 2.5 Announcements (4)

`announcements` (R: search box, Filter button, cards, pager "Showing 1–4 of 4"; Important cards get a 3px warning left border), `announcement-detail` (R `/announcements/[id]`, type + status badges, related-contest callout), `announcement-important` (S of detail: warning style), `announcements-empty` (S). Types: General, Important, Contest, Lecture, Attendance.

### 2.6 Lectures (7) and Attendance (7)

Lectures:
- `lectures` R `/lectures` (2-column cards: status, "Resources" badge, attendance badge, title, desc, date·time, View) with search + Filter button.
- `lecture-detail` / `lecture-live` / `lecture-soon` / `lecture-done` / `lecture-idle`: **one route** `/lectures/[id]`, five states.

| State | Status badge | Join button | Attendance card |
|---|---|---|---|
| Upcoming | Upcoming | disabled | 4-digit code entry + Submit (open) |
| Live | Live + red dot | enabled external link | code entry (open) |
| Starting soon | Starting soon | disabled "Starting soon" | "Attendance is not currently active." |
| Completed | Completed | disabled "Session ended" | "Attended" badge + time |
| Idle (upcoming, attendance closed) | Upcoming | disabled | "Attendance is not currently active." |

- `lectures-empty` S.
- Detail sections: description, resources (title, type, Open/Download), live-session card.

Attendance:
- `attendance` R `/attendance`: 4 stat cards (Lectures 45, Attended 41, Missed 4, Attendance 91%), progress bar, history table (Lecture, Date, Session badge, Record), "Enter attendance code".
- `attendance-code` R `/attendance/[lectureId]` (also reachable inline from the lecture page): lecture name, 4 OTP boxes, Submit.
- Result states (all S of that route/response): `attendance-ok` ("Attendance recorded"), `attendance-bad` (danger callout "Invalid attendance code"), `attendance-expired` ("Attendance code expired / session has ended"), `attendance-duplicate` ("Attendance already recorded"), `attendance-inactive` ("Attendance is not currently active").

### 2.7 Contests (5), Results (2)

- `contests` R `/contests` — three sections Upcoming / Active / Completed; empty sections print "No active contests."
- `contest-detail` / `contest-active` / `contest-done`: one route `/contests/[id]`, three states. Invitation card (important style) with "Open contest" external link; About card (platform, contest ID mono, when, duration, invitation link); "Your result" card (rank/score/penalty when completed, otherwise explanatory text).
- `contests-empty` S.
- `results` R: leaderboard, summary cards (Your rank, Your score, Penalty), search participant, table (Rank, Participant, Handle, Score, Penalty), current user's row highlighted (`.is-me`), pager. `results-empty` S.

### 2.8 Progress and verification (4 + 5)

- `progress` R `/progress` — overall solved bar + per-topic cards (name, n/total, bar, Open topic).
- `topic` R `/progress/topics/[topicId]` — table: Problem, Value, Platform, Status badge, Action ("I solved this" or Solved badge).
- `progress-empty`, `problems-empty` S.
- `problem` R `/progress/problems/[problemId]` — key/value details, "I solved this", callout explaining the click does **not** mark it solved.
- Verification states: `verify-pending` (spinner "Verifying your solution…"), `verify-ok` ("Successfully solved", "Verified on Codeforces", solved-at date), `verify-fail` ("Problem not solved" + Try again), `verify-unlink` ("Codeforces account not linked" + Link account).
- Status vocabulary in the prototype: **Solved, Not solved, Verification pending, Verification failed** (failed has a badge style but no table-row path; the topic table collapses everything not Solved/Not solved into pending).

### 2.9 Rating (4) and streak

`rating` (R: rating card with stars, previous, delta, "Active account" badge; breakdown card with three component bars: Problem solving, Contest performance, Attendance), `rating-history` (R `/rating/history`: SVG line chart + table Date/Previous/New/Change/Source), `rating-empty` (S), `rating-warning` (S: warning callout + "Warning" badge; shown at 2.14).

### 2.10 Profile and restricted (3)

`profile` R (identity, Codeforces/LeetCode handles in mono, account badge; Standing card), `link-handles` R `/profile/handles` (two fields, Save), `restricted` (R `/restricted`, locked page with no sidebar: "Restricted" badge, rating 1.84, `mailto:dsa-heads@ncc.edu`, Log out). The restricted layout takes over **all** routes for restricted accounts.

### 2.11 System states (3)

`network-error` ("Something went wrong" + Try again), `not-found` ("Page not found"), `forbidden` ("You do not have access — limited to administrators"). All render inside the app shell.

### 2.12 Admin (48 screens)

Admin sidebar (6 sections): **Overview** Dashboard; **People** Users, Restricted; **Learning** Announcements, Lectures, Attendance; **Competition** Contests, Results; **Practice** Problems, Topics, Progress; **Performance** Rating. Footer: **Two-factor** link, identity, Log out. Topbar bell → admin notifications.

| Area | Screens | Target |
|---|---|---|
| Overview | `admin-dashboard` (8 stat tiles: Students 128, Active 121, Restricted 7, Upcoming lectures 3, Attendance open 1, Upcoming contests 1, Problems 120, Average rating 3.84; recent activity timeline), `admin-notifications` | `/admin/dashboard`, `/admin/notifications` |
| Users | `admin-users` (search, Filters drawer: Role / Status / Joined-after; table Name, Email, Role, Rating, Status, Attendance, Actions; pager), `admin-users-filter` (S), `admin-users-loading` (S), `admin-user`, `admin-user-restricted` (R detail: account, problem progress, recent contest, rating history; Reopen) | `/admin/users`, `/admin/users/[id]` |
| Announcements | list, create, edit (R); delete confirm (M); publish toast (M); deleted state + toast | `/admin/announcements[/new\|/[id]/edit]` |
| Lectures | list, create/edit form (title, status, description, date, time, live link, one resource row + "Add resource"), publish confirm (M), delete confirm (M) | `/admin/lectures[/new\|/[id]/edit]` |
| Attendance | sessions list (active session card: code 4837, countdown, View submissions), start confirm (M: lecture, code, validity), active session (code, countdown, End session), submissions table (search + status filter) | `/admin/attendance`, `/admin/attendance/[sessionId]` |
| Contests | list (Contest, Platform, Date, Status, Results state, actions menu), create/edit form (title, platform, description, CF contest ID/URL/invitation link, date, time, duration, publication), publish (M), delete (M) | `/admin/contests[/new\|/[id]/edit]` |
| Results | idle, loading, success (processed 42 / matched 37 / unmatched 5 + unmatched handles), error, publish confirm (M), published toast | `/admin/results[/[contestId]]` |
| Problems/Topics | problems list (search, platform filter, topic filter), add/edit form, delete (M); topics list, topic edit form | `/admin/problems…`, `/admin/topics…` |
| Progress | per-student table, per-student detail (topic bars + DP problem list) | `/admin/progress[/[userId]]` |
| Rating | table (current, problem, contest, attendance, last update), recalc confirm (M), success toast | `/admin/rating` |
| Restrictions | restricted users table, reopen confirm (M), restored state + toast | `/admin/restricted` |
| Two-factor | setup (QR + setup key), code entry (6 OTP boxes), invalid code, enabled | `/admin/security/2fa` |

Recurring UI pieces: row-action menu (Edit/Delete/…), delete-confirm modal (announcements, lectures, contests, problems), publish-confirm modal (lectures, contests, results), toast success.

---

## 3. Proposed route map

URL structure is flat for students (as the prototype's sidebar suggests); route groups only organize layouts.

```
app/
  layout.js                          root: fonts, <html data-theme>, theme boot
  not-found.js  error.js  global-error.js
  (auth)/                            AuthLayout (brand panel + card)
    login/page.js   register/page.js
  (student)/                         requires session + status=active (whether admins may open student pages is undecided)
    layout.js                        StudentShell
    dashboard/  notifications/  streak/
    announcements/ [id]/
    lectures/ [id]/
    attendance/ [lectureId]/
    contests/ [id]/
    results/ [contestId]/
    progress/ topics/[topicId]/ problems/[problemId]/
    rating/ history/
    profile/ handles/
  restricted/page.js                 locked page (own layout; middleware + server guard send restricted users here)
  admin/                             requires role=admin (+ 2FA when enabled)
    layout.js                        AdminShell
    dashboard/ notifications/
    users/ [id]/        restricted/
    announcements/ new/ [id]/edit/
    lectures/ new/ [id]/edit/   attendance/ [sessionId]/
    contests/ new/ [id]/edit/   results/ [contestId]/
    problems/ new/ [id]/edit/   topics/ new/ [id]/edit/
    progress/ [userId]/         rating/
    security/2fa/
  api/ …                              see section 6
```

Decisions embedded here:
- Prototype states (loading/empty/error/success) become `loading.js`, empty components and inline UI states, **not** routes.
- `unauthorized` and `session-expired` become `/login?reason=`.
- The spec suggests `(auth)/forgot-password`; **the prototype has no such screen**, so it is excluded pending approval.
- The prototype's `results` shows only Contest #03 with no selector. Proposal: `/results` redirects to the latest published contest; `/results/[contestId]` is canonical.
- `forbidden` is rendered by a shared component (Next 15 `forbidden()` is experimental; avoid).
- Notifications are **not** a sidebar item in the student app; they are the bell in the topbar.

---

## 4. Design tokens and shared components

### 4.1 Tokens (extracted verbatim from `.artboard[data-theme]` in `app.css`)

| Token | Light | Dark |
|---|---|---|
| `--bg` | #f3f5f8 | #0c1117 |
| `--surface` | #ffffff | #121922 |
| `--card` | #ffffff | #171f2a |
| `--sunken` | #eef1f6 | #0e141c |
| `--border` | #e1e6ee | #2a3544 |
| `--border-strong` | #cdd5e1 | #3a475a |
| `--text` | #12161f | #e7edf4 |
| `--text-secondary` | #3e4a5c | #c5d0de |
| `--muted` | #5c687a | #96a3b5 |
| `--primary` | #0f6e56 | #3ddc97 |
| `--primary-hover` | #0c5b47 | #6ae6b0 |
| `--primary-soft` | #e5f6f0 | #123226 |
| `--primary-text` | #ffffff | #062016 |
| `--secondary` | #1b3a4b | #243447 |
| `--success` / `--up` | #0f7a3a | #3ddc97 |
| `--success-soft` | #e6f6ec | #123226 |
| `--warning` | #8a5a00 | #f0b429 |
| `--warning-soft` | #fff4d6 | #3a2e12 |
| `--error` / `--down` | #b4232c | #ff8b95 |
| `--error-soft` | #fdecee | #3c1a20 |
| `--info` | #1d5bbf | #9dc2ff |
| `--info-soft` | #e7f0fc | #17263c |
| `--star` | #a87400 | #f0b429 |
| `--highlight` (current-user row) | #e7f6f0 | #13281f |
| `--sidebar` | #f7f8fa | #0a0f15 |
| `--sidebar-text` | #1c2430 | #d7e0ea |
| `--sidebar-muted` | #667386 | #8e9caf |
| `--sidebar-hover` | #e8edf2 | #17202b |
| `--sidebar-active` | #e5f4ee | #143228 |
| `--sidebar-active-text` | #0c5b47 | #b9f6d8 |
| `--topbar` | #ffffff | #10161e |
| `--focus` | #0f6e56 | #3ddc97 |
| `--focus-ring` | rgba(15,110,86,.2) | rgba(61,220,151,.22) |
| `--overlay` | rgba(16,22,32,.48) | rgba(0,0,0,.62) |
| `--brand-panel` | #101820 | #080c11 |
| `--brand-panel-text` | #e8eef6 | #e8eef6 |
| `--brand-panel-muted` | #9aabb8 | #93a3b5 |
| `--heat-0…4` | #e6eaf0 #c9ebdd #73c9a8 #1f8a70 #0d5c47 | #1a2330 #143d2e #1b6b4a #1f9a68 #3ddc97 |
| `--shadow` | `0 1px 2px rgba(16,24,40,.06), 0 10px 24px rgba(16,24,40,.05)` | `0 1px 2px rgba(0,0,0,.35), 0 12px 28px rgba(0,0,0,.28)` |

Hard-coded (not tokens) in the prototype CSS: `.btn-danger #c4232c`, `.btn-success #0f7a3a`, `.live-dot #e23b48`, `.btn-secondary` text `#f4f7fb`, QR colors. **Decision needed:** promote to tokens (recommended) or keep literal.

Not product tokens: all `--viewer*` values and `.v-*`, `#viewer-*`, `.seg`, `.proto-link`, `.spec-board`, `.swatch-*`, `.flow-*`, `.page-index`, `.component-label` (viewer/spec chrome).

Typography: `IBM Plex Sans` 400/500/600 and `IBM Plex Mono` 400/500. Scale (Foundations page): Display 40/48·600, H1 28/34·600, H2 22/28·600, H3 18/26·600, Body-lg 18/28, Body 15/24, Body-sm 13/20, Caption 12/16·500, Button 14/20·600, Label 13/16·600, Code 13/20 mono. Headings use negative tracking (-.03em/-.02em). Base: 15px / 1.5.

Spacing: 4, 8, 12, 16, 24, 32 (desktop page padding), 40, 48, 64. Page padding 28/32 → 20/16 at ≤800px. Radius: controls 8, cards 12, modals 16 (plus 6/10 for small elements, 99 for pills/bars). Layout constants: sidebar 248px, topbar 56px, button heights 32/40/48, controls min-height 40, OTP box 48×56 (44×52 at ≤420).
https://ai.dev/rate-limit?utm_source=chatgpt.com
Breakpoints (prototype uses **container queries on the artboard**, not viewport): ≤1100 (hero grid 2-col, stat grid 2-col), ≤800 (sidebar → off-canvas drawer, tables → cards, grids → 1 col, modal → bottom sheet, auth brand shrinks), ≤420 (smaller OTP, wrapping buttons).

### 4.2 Component inventory (from `ui.js`, `screens-*.js`)

| Component | Prototype source | Variants / states to preserve |
|---|---|---|
| `AppShell` (student/admin) | `appShell` | sidebar sections, active link, drawer open, scrim, topbar crumbs, bell, user chip |
| `AuthLayout` | `authLayout` | brand panel + card |
| `LockedLayout` | `.lock` | restricted page |
| `PageHead` | `pageHead` | title, description, action cluster |
| `Breadcrumbs` | `crumbs` | last item `aria-current` |
| `Button` | `btn` | primary/secondary/outline/ghost/danger/success × sm/md/lg; block; icon; loading (spinner); disabled; renders `<a>` when it navigates |
| `Field` | `field` | text/email/url/number/date/time/select/textarea/password; hint/error/success/disabled/focus; password show-hide with `aria-pressed` |
| `OtpInput` | `otp` | n digits (4 attendance, 6 2FA); numeric only, auto-advance, backspace-back |
| `SearchBox`, `Toolbar` | `searchBox` | |
| `Badge` | `badge`+`statusKind` | kinds: published, draft, active, upcoming, completed, solved, unsolved, pending, failed, restricted, active-account, warning, live, info, ok, danger, neutral. Note: CSS defines colors for only some; `draft`, `completed`, `unsolved`, `neutral` fall back to the sunken grey pill |
| `Card` (+ `important`, `flat`, `mini`) | `.card` | |
| `StatCard` | `.stat-*` | label/value/hint, up/down |
| `RatingStars` | `stars` | 0–5, `role="img"` |
| `ProgressBar` | `bar` | `role="progressbar"` |
| `DataTable` | `smartTable` | table ≥800px, card list below; `is-me` and `is-selected` rows; min width per table; sort marker on Rank/Rating |
| `Pagination` | `pager` | "Showing a–b of n" |
| `RowMenu` | `menu` | actions dropdown (needs keyboard support) |
| `Modal` / `ConfirmDialog` | `modal` | centered desktop, bottom sheet ≤800px; focus trap needed |
| `Drawer` | `.drawer` | right-side filters |
| `Toast` | `toast` | ok/bad/warn/info, top-right |
| `Callout` | `.callout` | info/warn/danger/ok; `role="alert"` for errors |
| `EmptyState`, `StatusPanel`, `ErrorState` | `emptyBlock`, `.status-panel` | |
| `Skeleton`, `Spinner` | | reduced-motion respected |
| `LineChart` | `lineChart` | 720×250 SVG, y axis fixed 1–5, categorical x, accessible label + caption |
| `ActivityCalendar` | `heatCalendar` | 18 weeks × 7, 5 levels, legend |
| `Timeline`, `ListRow`, `KeyValueList`, `ResourceRow`, `BreakdownRow` | | |
| `Icon` | `PATHS` | 27 custom stroke icons (1.75 stroke, 24 viewbox) |
| `QrCode` | `qr()` | **sample only**; real implementation needs a QR library |

Decision pending: the prototype's icons are custom paths; `lucide-react` is already installed. Using lucide will change glyph shapes slightly. Recommended: port the 27 prototype paths into one `Icon` component for parity; use lucide only for icons the prototype lacks.

### 4.3 Theme behavior

Prototype: `data-theme="light|dark"`, **default dark**, persisted in `localStorage` (`ncc-dsa-theme`), set from a toolbar that exists only in the viewer. The product has **no theme switcher screen**, so a toggle location (topbar? profile?) must be decided. Recommended single source of truth: `data-theme` attribute on `<html>`, stored in a cookie (readable in the root layout to avoid a flash), React context only as a setter. Tokens defined once in `globals.css` under `:root[data-theme=…]` and mapped to Tailwind via `@theme inline`.

---

## 5. Database schema proposal (MongoDB / Mongoose)

All collections get `createdAt/updatedAt` (`timestamps: true`). IDs are ObjectIds. Server clock only for event times. Emails lowercased and trimmed.

### 5.1 Collections

**User** — `name`, `email` (unique, lowercase), `passwordHash`, `role` ∈ {student, admin}, `status` ∈ {active, restricted, disabled}, `restrictedAt`, `restrictedReason`, `handles.codeforces`, `handles.leetcode` (validated, optional), `ratingCurrent` (denormalized cache of latest RatingHistory), `twoFactor` {`enabled`, `secretEnc`, `enabledAt`}, `lastLoginAt`. Indexes: `email` unique; `{role,status}`; `{name:'text', email:'text'}` or regex search for admin.

**Session** — `userId`, `tokenHash` (unique), `expiresAt` (TTL index), `createdAt`, `ip`, `userAgent`, `twoFactorVerified`. (Only if the opaque-session option is chosen; see Q1.)

**Topic** — `name`, `slug` (unique), `order`.

**Problem** — `title`, `topicId`→Topic, `platform` ∈ {codeforces, leetcode}, `value` (Number), `url`, `externalRef` {`contestId`, `index`} or {`titleSlug`}, `status` ∈ {draft, published}, `deletedAt`. Indexes: `{topicId,status}`, text on title.

**ProblemVerification** — `userId`, `problemId`, `status` ∈ {pending, solved, failed}, `platform`, `solvedAt` (platform timestamp), `verifiedAt` (server), `lastCheckedAt`, `attempts`, `failureReason`. Unique `{userId, problemId}`. "Not solved" = no document; "Account not linked" = derived from `User.handles`.

**Lecture** — `title`, `description`, `scheduledAt` (single UTC Date; prototype splits date/time), `liveUrl`, `status` ∈ {draft, published}, `sessionState` ∈ {scheduled, live, ended} (admin controlled), `resources[]` {`title`, `type` ∈ {pdf, link, file}, `url`}, `deletedAt`. Index `{status,scheduledAt}`.

**AttendanceSession** — `lectureId`, `code` (4 digits, server-generated), `openedBy`, `opensAt`, `expiresAt`, `closedAt`, `failedAttempts` per user tracked separately. Partial unique index: one open session per lecture (`closedAt: null`). The admin UI must show the code, so it is stored retrievable; it is never returned by student endpoints.

**AttendanceRecord** — `sessionId`, `lectureId`, `userId`, `submittedAt` (server). Unique `{sessionId,userId}`. "Missed" is derived: a lecture whose session closed with no record for the user.

**Contest** — `title`, `description`, `platform` (codeforces), `platformContestId`, `url`, `invitationUrl`, `startsAt`, `durationMinutes`, `publication` ∈ {draft, published}, `resultsState` ∈ {not_fetched, fetched, published}, `lastFetchedAt`, `fetchSummary` {`processed`, `matched`, `unmatchedHandles[]`}, `deletedAt`. Derived status: upcoming / active / completed from `startsAt`+`durationMinutes`.

**ContestResult** — `contestId`, `userId`, `handle`, `rank`, `score`, `penalty`, `fetchedAt`. Unique `{contestId,userId}`. Visible to students only when `Contest.resultsState = published`.

**ContestInvitation** — *(proposed, optional)* `contestId`, `userId`, `createdAt`. See Q10; default is implicit invitation for every active student of a published contest, which makes this collection unnecessary.

**RatingHistory** — `userId`, `previous` (nullable), `value`, `change`, `source` ∈ {initial, scheduled, manual}, `components` {`problem`, `contest`, `attendance`}, `runId`, `computedAt`. Index `{userId, computedAt:-1}`.

**ActivityEvent** — `userId`, `type` ∈ {problem_solved, attendance, contest_result, rating_change}, `refId`, `occurredAt`, `day` (date bucket). Feeds recent activity, the streak and the calendar. Whether this is one collection or derived on the fly from the source collections is a Dev 4 decision inside the contract.

**Announcement** — `title`, `body`, `type` ∈ {general, important, contest, lecture, attendance}, `status` ∈ {draft, published}, `publishedAt`, `createdBy`. Index `{status,publishedAt:-1}`.

**Notification** — `userId`, `type`, `title`, `body`, `href`, `readAt`, `createdAt`. Index `{userId, createdAt:-1}`.

**AuditLog** — `actorId`, `action` (e.g. `lecture.publish`), `entityType`, `entityId`, `summary`, `meta`, `createdAt`. Index `{createdAt:-1}`. Also feeds the admin "Recent activity" and admin notifications.

**RateLimit** — only if rate limiting is stored in Mongo (Q12): `key`, `count`, `expiresAt` (TTL).

### 5.2 Relationships

```
User 1─* Session
User 1─* AttendanceRecord *─1 AttendanceSession *─1 Lecture
User 1─* ProblemVerification *─1 Problem *─1 Topic
User 1─* ContestResult *─1 Contest
User 1─* RatingHistory
User 1─* Notification
User 1─* ActivityEvent
User 1─* AuditLog (as actor)
Announcement *─1 User (createdBy)
Contest 1─* (ContestInvitation) *─1 User     [optional]
```

Integrity rules: every unique index above is the duplicate guard (attendance, verification, result); attendance submission and the open-session guard use atomic upserts rather than read-then-write; restriction/reopen writes the user and an AuditLog in one transaction (Atlas replica sets support them); lectures, contests, problems use **soft delete** (`deletedAt`) because other records reference them; announcements may hard-delete.

Single owner per model (see section 7) and a shared `lib/db/connect.js` (cached connection on `globalThis`).

---

## 6. API contract outline

### 6.1 Conventions (to be ratified)

- Success `{ "success": true, "data": … }`; error `{ "success": false, "error": { "code", "message", "fields" } }` (spec's recommended shape).
- Paged lists: query `page` (1-based), `pageSize` (default 20, max 50), `q`, plus resource filters, `sort`. `data = { items, page, pageSize, total }`.
- Status codes: 200/201; 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN` or `ACCOUNT_RESTRICTED`; 404 `NOT_FOUND`; 409 `CONFLICT`; 429 `RATE_LIMITED`; 502 `UPSTREAM_ERROR`; 503 `SERVICE_UNAVAILABLE` (DB); 500 `INTERNAL_ERROR`.
- Identity always from the verified session; no `userId`, `role`, `rating` or `status` is accepted from a client body.
- One shared helper per handler: `withApi(handler, { auth: 'public'|'student'|'admin' })` that connects to the DB, resolves the session, enforces role and restriction, validates with zod, and shapes errors. Written by Dev 1, session resolution by Dev 2.
- Restricted students: every endpoint except `GET /api/auth/me` and `POST /api/auth/logout` returns 403 `ACCOUNT_RESTRICTED`.
- Admin mutations write an `AuditLog` row through a shared `audit()` helper.

### 6.2 Endpoints

| Method + URL | Auth | Purpose |
|---|---|---|
| POST `/api/auth/register` | public, rate limited | `{name,email,password,confirmPassword}` → 201 user |
| POST `/api/auth/login` | public, rate limited | `{email,password}` → user + `requiresTwoFactor`; generic error on failure |
| POST `/api/auth/logout` | session | destroy session |
| GET `/api/auth/me` | session | user, role, status, rating snapshot |
| POST `/api/admin/security/2fa/setup` · `/verify` | admin | TOTP enrol/verify (if approved, Q6) |
| GET/PATCH `/api/users/me` | student | profile read; PATCH only approved fields (name) |
| PUT `/api/users/me/handles` | student | `{codeforces?,leetcode?}` format-validated |
| GET `/api/dashboard` | student | aggregate of rating, streak, attendance, solved, contests, upcoming, announcements, activity |
| GET `/api/announcements` · `/:id` | student | published only; `q`, `type`, paging |
| GET `/api/notifications` · POST `/:id/read` · POST `/read-all` | student | own only |
| GET `/api/lectures` · `/:id` | student | published; `status` filter; includes resources, derived state, own attendance state |
| GET `/api/attendance/me` | student | stats + history |
| POST `/api/lectures/:id/attendance` | student | `{code}` → 201 or 400 `ATTENDANCE_INVALID_CODE`, 409 `ATTENDANCE_EXPIRED` / `ATTENDANCE_NOT_ACTIVE` / `ATTENDANCE_DUPLICATE`, 429 |
| GET `/api/contests` · `/:id` | student | published; grouped by derived status; own invitation + own result |
| GET `/api/contests/:id/results` | student | only if `resultsState=published`; `q`, paging; marks current user |
| GET `/api/progress` · `/topics/:id/problems` · `/problems/:id` | student | summary, topic table, problem |
| POST `/api/problems/:id/verify` | student, rate limited | idempotent; returns `pending|solved|failed|unlinked|unavailable` |
| GET `/api/rating/me` · `/me/history` · GET `/api/streak/me` | student | |
| GET `/api/admin/dashboard` · `/audit-log` | admin | stats; feed for recent activity/notifications |
| GET `/api/admin/users` · `/:id` · PATCH `/:id/status` | admin | `{status, reason}`; restrict/reopen; audited |
| CRUD `/api/admin/announcements` + POST `/:id/publish` | admin | |
| CRUD `/api/admin/lectures` + POST `/:id/publish`, `/:id/session/start`, `/:id/session/end` | admin | |
| GET `/api/admin/attendance` · `/:sessionId`; POST `/api/admin/lectures/:id/attendance/start` `{validForSeconds}`; POST `/api/admin/attendance/:sessionId/close` | admin | |
| CRUD `/api/admin/contests` + POST `/:id/publish`; POST `/:id/results/fetch`; POST `/:id/results/publish`; GET `/:id/results` | admin | fetch calls Codeforces; returns processed/matched/unmatched |
| CRUD `/api/admin/problems`, `/api/admin/topics` | admin | |
| GET `/api/admin/progress` · `/:userId` | admin | |
| GET `/api/admin/rating` · POST `/api/admin/rating/recalculate` | admin | recalculation job; returns `runId` and counts |

Per-endpoint schemas (zod) and example payloads will live in `docs/api.md` after approval; they are deliberately not expanded here to keep this a reviewable outline.

---

## 7. Five-person ownership and dependency matrix

Product screens only (specification pages excluded). Counts are prototype screens including states.

| Owner | Owns | Prototype screens | Files / areas |
|---|---|---|---|
| **Dev 1 — Foundation** | tokens, `globals.css`, theme, Icon/Button/Field/Badge/Card/Table/Modal/Toast/etc., StudentShell, AdminShell, AuthLayout, LockedLayout, `lib/db/connect.js`, `withApi`, API envelope, error/empty/loading components, system states, README, CI, seed runner, integration | network-error, not-found, forbidden, mobile-nav (4) + shared states | `components/ui|layout|navigation`, `styles/`, `lib/db`, `lib/api`, `app/layout.js`, `scripts/` |
| **Dev 2 — Auth & accounts** | User, Session models; register/login/logout/me; password hashing; session cookie; role + restriction guards (`requireUser`, `requireAdmin`); rate limiting; profile & handles; admin 2FA; account tests | login×4, admin-login, register×4, session-expired, unauthorized (11), restricted (1), profile, link-handles (2), admin-2fa×4 (4) = 18 | `app/(auth)`, `app/restricted`, `app/(student)/profile`, `app/admin/security`, `lib/auth`, `lib/permissions`, `models/User.js|Session.js` |
| **Dev 3 — Learning & attendance** | Lecture, AttendanceSession, AttendanceRecord, Announcement, Notification models + services; student dashboard page and aggregator; attendance workflow tests | dashboard, dashboard-loading, notifications (3), announcements×4, lectures×7, attendance×7, = 21 | `app/(student)/dashboard|announcements|lectures|attendance|notifications`, matching `app/api`, `models/` |
| **Dev 4 — Contests & progress** | Contest, ContestResult, Topic, Problem, ProblemVerification, RatingHistory, ActivityEvent models + services; Codeforces client; verification; rating & streak calculation; tests | contests×5, results×2, progress×4, problem/verify×5, rating×4, streak (1) = 21 | `app/(student)/contests|results|progress|rating|streak`, `lib/integrations`, matching APIs |
| **Dev 5 — Administration** | all admin UI + `/api/admin/*` routes calling the owners' services; AuditLog model + `audit()` helper | admin screens except 2FA (44) | `app/admin/**` (except security), `app/api/admin/**`, `models/AuditLog.js` |

Total: 4 + 18 + 21 + 21 + 44 = 108 screens + 8 specification pages = 116.

### Dependency order

1. **Dev 1 → everyone**: tokens, shell, base components, `withApi`, DB connect. Nothing in Milestone 4 should start UI before this lands (mock adapter allowed for data, not for shared components).
2. **Dev 2 → everyone**: `getSession()`, `requireUser()`, `requireAdmin()`, restriction enforcement. Interim: an agreed stub that returns a fixed dev user, behind a clearly named dev-only flag, replaced when Dev 2 merges.
3. **Dev 3 and Dev 4 → Dev 5**: Dev 5's admin routes must call `lib/services/*` functions owned by Dev 3/4. Contract-first: Dev 3 and Dev 4 publish service signatures (in `docs/services.md`) in the first week so Dev 5 can build against them.
4. **Dev 4 → Dev 3's dashboard**: dashboard needs rating/streak/solved/contest data via Dev 4 services.
5. **Dev 2 ↔ Dev 4**: restriction triggered by rating (Q4) needs one agreed function, e.g. `applyRestrictionPolicy(userId)`.

Load note: Dev 1 and Dev 5 carry the heaviest UI volume (Dev 5 has 44 screens/forms). Suggest Dev 1 also builds the admin dashboard widgets and the shared admin CRUD scaffolding (list + form + confirm), so Dev 5 mainly assembles. The lead should confirm.

Shared-file rule: `models/`, `lib/services/`, `docs/api.md` and `docs/schema.md` change only through a PR that names the owner as reviewer.

---

## 8. Milestone checklist

**M1 — Audit (this document).** Acceptance: lead signs off sections 3, 5, 6, 7 and answers the blocking questions in section 10. *Gate before M2.*

**M2 — Foundation (Dev 1).**
- [ ] Replace starter `layout.js`/`page.js`/`globals.css`; IBM Plex via `next/font`; tokens in light+dark; Tailwind `@theme` mapping
- [ ] Theme cookie + toggle, no flash
- [ ] Ported prototype CSS (cards, tables, badges, forms, shell) and responsive breakpoints at 1100/800/420
- [ ] Shared components from 4.2, each demonstrated on a dev-only `/_components` page (excluded from production build)
- [ ] StudentShell, AdminShell, AuthLayout, LockedLayout, drawer navigation
- [ ] `lib/db/connect.js`, `withApi`, error envelope, zod helper
- [ ] ESLint, Prettier decision, test runner, CI (lint + build), PR template, branch protection instructions
- [ ] `.env.example` updated, README rewritten
- Acceptance: `npm run lint` and `npm run build` pass; component page matches prototype Components page in both themes at all four widths.

**M3 — Auth & access control (Dev 2).**
- [ ] Register/login/logout/me with generic errors, rate limits, secure cookies
- [ ] Guards used by `withApi`; restricted users forced to `/restricted` on pages and 403 on APIs
- [ ] Dev-only seeded accounts (passwords from env, not committed)
- [ ] Tests: student cannot reach any `/api/admin/*`; restricted blocked; expired session
- Acceptance: all auth states in 2.3 reproducible; negative authorization tests pass.

**M4 — Features (parallel, small PRs each).**
- Dev 3: announcements → lectures → attendance (with duplicate/expiry/attempt-limit tests) → notifications → dashboard.
- Dev 4: topics/problems → contests → results/leaderboard policy → rating + streak → verification (Codeforces first).
- Dev 5: admin shell pages and CRUD in the order owners' services land; first integration build in week 1 using mocked services against the contract.
- Acceptance per feature: all states in section 2 for that area, server validation, owner tests green.

**M5 — Integration.** Replace adapters with real services; remove mock data from production flows; run both role journeys end to end (register → attendance → contest → verify → rating → restriction → admin reopen).

**M6 — Design parity.** Side-by-side check of every screen in section 2 at 1440/1280/768/390 in both themes; fix drift; accessibility pass (focus trap, menu keyboard support, labels).

**M7 — Security, quality, deployment.** Authorization and validation test sweep, failure-state tests (DB down, upstream down), production build, env configuration, deployment, README/known limitations (Codeforces/LeetCode caveats).

---

## 9. Prototype gaps, inconsistencies, and what they affect

These are things in the prototype that cannot be implemented literally.

1. **Rating formula is not derivable.** Component scores (4.5 / 4.1 / 4.7) average to 4.43 but the official rating shown is 4.27; Hana (4.80/4.40/4.70 → 4.62) and Liya (1.60/1.90/2.10 → 1.84) are also not plain means. Weights, rounding and the 1–5 scale mapping are undefined.
2. **Restriction threshold is never stated.** Warning shown at 2.14, restricted at 1.84. Also unclear whether restriction is automatic after a recalculation or an admin action; the admin UI has **Reopen** but no **Restrict** action, although the activity feed contains "User restricted".
3. **Sample-data error:** `admin-restricted` lists Ibrahim Kedir at 1.84 / Restricted while every other screen has him at 4.27 / Active.
4. **Streak rule is undefined.** "Qualifying activity" is not defined; calendar sample data is computed by a formula, not real.
5. **Dashboard "Upcoming lectures"** renders all lectures including a completed one; production needs a real filter.
6. **Filter buttons without UI:** Announcements and Lectures show a Filter button but no filter drawer exists (only Admin Users has one); the announcements button points at a drawer that is not rendered.
7. **Results has no contest selector;** every completed contest's "View results" goes to Contest #03.
8. **Attendance details disagree:** start-confirm modal says "Dynamic Programming #02", validity "10 minutes 15 seconds", the active-session card counts down from 08:42, and the lecture is titled "Introduction to Dynamic Programming" elsewhere. Validity rules and who picks them are unspecified.
9. **4-digit attendance code** has only 10,000 values; without attempt limiting it can be guessed. The prototype is silent on this.
10. **Lecture lifecycle** has "Upcoming", "Starting soon", "Live", "Completed" but no rule for "Starting soon" versus "Upcoming" (time window? admin action?), and no admin control to set a lecture live.
11. **Profile** only edits linked handles (name, email, password change are absent).
12. **Notifications** (student): three hard-coded items, no unread indicator on the bell. Admin "notifications" are the activity feed.
13. **Resource type "File"** implies uploads, but there is no upload UI and no storage chosen.
14. **Forgot password, email verification, admin role management, admin account creation** have no screens.
15. **Admin 2FA** is in the prototype but not in the written specification. The QR is a drawn sample.
16. **Badge styles** missing for `draft`, `completed`, `unsolved`, `neutral` fall back to the default grey pill; the contest "Active" state only exists as an empty section in the list.
17. **Admin top-bar user chip** links to Two-factor (there is no admin profile).
18. Chart x-axis is categorical (equal spacing) even though dates are uneven; the history cadence is weekly with one off-cycle point (Sep 18).
19. Sample data includes a real-looking name, email and a Codeforces handle; confirm these may be used as seed data or should be anonymized.
20. The prototype uses hash navigation and `container-type` queries inside an artboard; a production app uses viewport media queries or a container on the app root. Equivalent breakpoints are proposed in 4.1.

---

## 10. Decisions and questions for the lead

### Blocking (must be answered before M2/M3)

1. **Session strategy.** Recommended: server-side sessions (opaque random token in an HttpOnly cookie, SHA-256-hashed in a `Session` collection with TTL), `bcryptjs` (pure JS, no native-build issues on serverless) or `argon2` for hashing. Why: a restricted/disabled account must be blocked **immediately** and admin 2FA state must live in the session. Alternative: Auth.js v5 Credentials with JWT sessions (less code, but revocation needs a DB lookup on every request anyway). Pick one; `.env.example` already has `SESSION_SECRET`.
2. **Styling strategy.** Recommended: port the prototype's token variables and component CSS nearly verbatim into a CSS layer, map tokens into Tailwind `@theme`, and use Tailwind utilities for layout. Alternative: rebuild everything as Tailwind classes (higher drift risk against the prototype).
3. **Responsive implementation:** viewport media queries at 1100/800/420 (recommended) versus container queries on the app root.
4. **Rating and restriction policy** (items 1–2 in section 9): formula and weights, 1–5 scale, restriction threshold, automatic versus manual restriction, who/what triggers recalculation (scheduled job needs a host mechanism such as a cron endpoint with `CRON_SECRET`).
5. **Time zone policy** for lectures and contests (one campus time zone for entry and display, or viewer-local).
6. **Admin 2FA in scope?** If yes: TOTP library, QR generation library, an encryption key for stored secrets (`TWOFA_ENCRYPTION_KEY`), whether it is mandatory.
7. **Registration policy:** open sign-up, email-domain restriction, or allowlist ("the email your instructors already know"); how the first admin is created (seed script from env).
8. **Icon source:** port the 27 prototype icons (recommended) or lucide.
9. **Soft-delete policy** for lectures/contests/problems (recommended) and announcements hard-delete.

### Non-blocking (can be decided during M4)

10. **Contest invitations:** implicit for all active students on publish (recommended) or per-user `ContestInvitation`.
11. **LeetCode verification:** I am not aware of an official public API for per-user solved status; the only paths I know of are unofficial and may break or violate terms. Proposal: ship Codeforces verification first, show an honest "not configured/unavailable" state for LeetCode until a supported source is approved. Codeforces' public API appears to expose a user's submission list, which would support verification, but this must be confirmed against current documentation and rate limits before M4.
12. **Rate-limit store:** Mongo TTL collection (no extra infrastructure) versus Redis/Upstash.
13. **Attendance rules:** default validity, who sets it, attempt limit per student per session, one open session per lecture.
14. **Streak definition and day boundary.**
15. **Leaderboard policy:** proposed sort = score descending, then penalty ascending, tied entries share a rank (1, 2, 2, 4). Confirm that Codeforces "points" are the intended score (ICPC-style contests report solved-count and penalty instead).
16. **Test stack:** proposed Vitest + mongodb-memory-server (or a test database) for service/API tests, Playwright for a small set of journeys.
17. **File resources:** URL-only in v1 (recommended) or choose storage.
18. **Git flow:** trunk-based on `main` with short-lived feature branches (simplest) versus `develop`. Branch protection must be enabled by a repository admin; I could not check it.
19. **Theme toggle placement and default** (prototype default is dark; confirm vs `prefers-color-scheme`).
20. **Seed data:** reuse prototype sample data in a dev-only `scripts/seed.js`; anonymize names/handles?

### Proposed environment variables (additions to `.env.example`, placeholders only)

`MONGODB_URI`, `SESSION_SECRET`, `APP_URL` (existing); `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_STUDENT_PASSWORD` (dev only); `CRON_SECRET`; `TWOFA_ENCRYPTION_KEY`; `ATTENDANCE_DEFAULT_VALID_SECONDS`; `CODEFORCES_API_KEY`, `CODEFORCES_API_SECRET` (only if signed requests are needed); `RATE_LIMIT_*` as needed.

---

## 11. What happens next

On approval of the contracts above I will start M2 in small PRs: (1) tokens + theme + fonts, (2) base components with a dev preview page, (3) shells and layouts, (4) DB/API helpers and CI. No feature screens will be started before the session and shell contracts are merged.