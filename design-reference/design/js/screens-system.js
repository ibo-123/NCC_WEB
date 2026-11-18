addScreen({
  id: "cover", order: 100, group: "01 Cover", title: "Cover",
  links: [["Design system", "foundations"], ["Components", "components"], ["Login", "login"], ["User dashboard", "dashboard"], ["Admin dashboard", "admin-dashboard"]],
  render() {
    const tiles = screenGroups().filter((g) => g.name !== "01 Cover").map((g) => `<a data-nav="${g.items[0].id}" href="#${g.items[0].id}"><small>${g.name.split(" ").slice(0, 1)}</small><strong>${g.name.replace(/^\d+\s/, "")}</strong></a>`).join("");
    return `<div class="spec-board">
      <div class="side-head" style="padding:0">${brandMark()}<span><span class="brand-name">NCC_DSA</span><span class="brand-sub">night code club</span></span></div>
      <div class="cover-hero">
        <div>
          <p class="kicker">NCC DSA · visual specification</p>
          <h1>A contest board for serious practice.</h1>
          <p class="secondary" style="margin-top:12px;max-width:46ch">Individual and Group tracks on one account — lectures, attendance, Codeforces rounds, rating, and dual streaks.</p>
          <div class="cluster" style="margin-top:18px"><span class="clock-chip">LIVE · 01:42:08</span><span class="rank-chip tier-5"><i></i>rating 4.27</span></div>
        </div>
        <div class="cover-logo" aria-hidden="true"><img src="assets/ncc-logo.png" alt="" width="220" height="220" /></div>
      </div>
      ${scoreboardStrip([["Tracks", "Individual + Group"],["Sample", "Ibrahim · Binary Hawks"],["Streaks", "12 AC · 8 team"],["Status", "Ready for build"]])}
      <div class="grid-3">
        <article class="card"><h3>Individual</h3><p class="secondary" style="margin-top:6px">Personal contests, progress, rating, AC streak.</p></article>
        <article class="card"><h3>Group</h3><p class="secondary" style="margin-top:6px">Teams, week-long Codeforces rounds, team streak.</p></article>
        <article class="card"><h3>Shared</h3><p class="secondary" style="margin-top:6px">Lectures, attendance, and problem sheets stay shared.</p></article>
      </div>
      <div class="page-index">${tiles}</div>
    </div>`;
  },
});

addScreen({
  id: "foundations", order: 200, group: "02 Design system", title: "Foundations",
  links: [["Components", "components"]],
  render() {
    const light = [["Logo navy", "#083B5B", "Primary / gradient start"], ["Logo indigo", "#303664", "Gradient mid"], ["Logo magenta", "#5D1C4D", "Clock / gradient end"], ["Sky lift", "#4EB8EF", "Dark-mode actions"], ["AC", "#047857", "Solved"], ["WA", "#B91C1C", "Failed"], ["Background", "#EEF2F7", "Grid paper"], ["Text", "#0A1624", "Primary text"]];
    const dark = [["Sky / primary", "#4EB8EF", "Actions (lifted navy)"], ["Magenta / clock", "#E87AB8", "Timer, live heat"], ["Logo navy", "#083B5B", "Gradient start"], ["Logo magenta", "#5D1C4D", "Gradient end"], ["AC", "#34D399", "Solved"], ["WA", "#FB7185", "Failed"], ["Background", "#050B14", "Night board"], ["Text", "#E8EEF7", "Primary text"]];
    const sw = (rows) => rows.map(([n, h, r]) => `<div class="swatch-row"><i style="background:${h}"></i><div><strong>${n}</strong> <span class="mono">${h}</span><div class="caption">${r}</div></div></div>`).join("");
    const type = [["Display", "40 / 48 · mono 700", "display"], ["H1", "28 / 34 · 700", "h1"], ["H2", "22 / 28 · 600", "h2"], ["H3", "18 / 26 · 600", "h3"], ["Body", "15 / 24 · 400", "b"], ["Caption", "12 / 16 · mono", "c"], ["Button", "13 / 20 · mono 650", "btn"], ["Code", "13 / 20 · JetBrains", "code"]];
    const shown = { display: `<div class="mono" style="font-size:40px;line-height:48px;font-weight:700;letter-spacing:-.04em;color:var(--rank)">rating 4.27</div>`, h1: `<h1 style="font-size:28px">Welcome back, Ibrahim</h1>`, h2: `<h2 style="font-size:22px">Standings</h2>`, h3: `<h3 style="font-size:18px">Dynamic Programming</h3>`, b: `<p>Attendance code window is open.</p>`, c: `<p class="caption">last AC · Oct 12</p>`, btn: `<span class="mono" style="font-weight:700;font-size:13px">submit // AC</span>`, code: `<span class="mono">ibrahimkediramdela2211</span>` };
    const space = [["4", "Icon gap"], ["8", "Tight stack"], ["12", "Table cell y"], ["16", "Form fields"], ["24", "Section gap"], ["32", "Page padding"]];
    return `<div class="spec-board">
      <div><p class="kicker">Design system</p><h1>Foundations</h1><p class="secondary">Colors sampled from the logo — navy #083B5B, indigo #303664, magenta #5D1C4D. Sky lift for dark actions. Space Grotesk + JetBrains Mono.</p></div>
      <div class="swatch-grid"><article class="card"><h2>Light</h2>${sw(light)}</article><article class="card"><h2>Dark</h2>${sw(dark)}</article></div>
      <article class="card"><h2>Type</h2>${type.map(([n, m, k]) => `<div class="type-row"><div><strong>${n}</strong><div class="caption">${m}</div></div><div>${shown[k]}</div></div>`).join("")}</article>
      <article class="card"><h2>Spacing</h2><p class="caption">8px base. Verdict chips use 2px radius.</p>${space.map(([n, use]) => `<div class="space-row"><span class="mono">${n}</span><div class="space-bar" style="width:${n}px"></div><span>${use}</span></div>`).join("")}</article>
      <div class="grid-3">
        <article class="card"><h3>Radius</h3><p class="caption">Controls 2 · Badges 2 · No card shells</p></article>
        <article class="card"><h3>Texture</h3><p class="caption">28px grid + hatch. Sections use hairline rules, not boxes.</p></article>
        <article class="card"><h3>Verdicts</h3><div class="cluster" style="margin-top:8px">${badge("solved", "AC")}${badge("failed", "WA")}${badge("pending", "Pending")}${badge("live", "Live")}</div></article>
      </div>
      <article class="card"><h2>Brand mark</h2><p class="caption" style="margin-bottom:12px">Moon + keyboard logo · PNG for chrome · SVG favicon</p>
        <div class="cluster" style="align-items:center;gap:20px">${brandMark()}${brandMark(72, "hero")}<img src="assets/ncc-mark.svg" width="40" height="40" alt="" style="color:var(--primary)" /></div>
      </article>
      <article class="card"><h2>Icons</h2><p class="caption" style="margin-bottom:12px">Square-cap stroke set · 1.5px</p>
        <div class="icon-grid">${[["dashboard","Board"],["trophy","Contest"],["rank","Standings"],["code","Problems"],["hash","Topics"],["ac","AC"],["wa","WA"],["flame","Streak"],["chart","Progress"],["terminal","Terminal"],["megaphone","Announce"],["book","Lecture"],["calendar","Schedule"],["clock","Clock"],["users","Team"],["user","Profile"],["bell","Alerts"],["lock","Restricted"],["shield","2FA"],["search","Search"],["filter","Filter"],["link","Handle"],["refresh","Fetch"],["alert","Warn"],["info","Info"],["plus","Add"],["menu","Menu"],["logout","Logout"],["eye","Reveal"],["check","Check"],["star","Star"]].map(([n, l]) => `<div class="icon-cell" title="${n}">${icon(n, 22)}<span class="mono">${l}</span></div>`).join("")}</div>
      </article>
    </div>`;
  },
});

addScreen({
  id: "components", order: 300, group: "03 Components", title: "Components",
  links: [["Login", "login"]],
  render() {
    const kinds = [["published", "Published"], ["draft", "Draft"], ["active", "Active"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["solved", "AC"], ["unsolved", "Not solved"], ["pending", "Pending"], ["failed", "WA"], ["restricted", "Restricted"], ["active-account", "Active"], ["warning", "Warning"], ["live", "Live"]];
    return `<div class="spec-board">
      <div><p class="kicker">Components</p><h1>UI primitives</h1><p class="secondary">Open sections, mono controls, AC/WA verdicts, and tabular standings — no boxed cards.</p></div>
      <article class="card stack"><p class="component-label">Button/Primary · Secondary · Outline · Ghost · Danger · Success</p>
        <div class="cluster">${btn("Primary")}${btn("Secondary", { variant: "secondary" })}${btn("Outline", { variant: "outline" })}${btn("Ghost", { variant: "ghost" })}${btn("Danger", { variant: "danger" })}${btn("Success", { variant: "success" })}</div>
        <div class="cluster">${btn("Small", { size: "sm" })}${btn("Medium")}${btn("Large", { size: "lg" })}${btn("Disabled", { disabled: true })}${btn("Loading", { loading: true })}</div>
      </article>
      <article class="card"><p class="component-label">Input states</p><div class="form-grid">
        ${field({ label: "Text", value: "", placeholder: "Lecture title" })}
        ${field({ label: "Email", type: "email", value: "ibrahim.kedir@ncc.edu" })}
        ${field({ label: "Password", type: "password", value: "password" })}
        ${field({ label: "Focus", value: "Binary search", focus: true })}
        ${field({ label: "Number", type: "number", value: "10" })}
        ${field({ label: "URL", type: "url", placeholder: "https://codeforces.com/contest/123456" })}
        ${field({ label: "Date", type: "date", value: "2026-10-17" })}
        ${field({ label: "Time", type: "time", value: "14:00" })}
        ${field({ label: "Select", type: "select", value: "Codeforces", options: ["Codeforces", "LeetCode"] })}
        ${field({ label: "Error", value: "ibrahim", error: "Enter a valid email address." })}
        ${field({ label: "Success", value: "ibrahim.kedir@ncc.edu", success: "Email is available." })}
        ${field({ label: "Disabled", value: "Locked field", disabled: true })}
        <div class="span-2">${field({ label: "Textarea", type: "textarea", value: "States, transitions, and how to read a DP problem before coding." })}</div>
      </div></article>
      <article class="card"><p class="component-label">Badge · verdict chips</p><div class="cluster">${kinds.map(([k, l]) => badge(k, l)).join("")}</div></article>
      <article class="card"><p class="component-label">Icon/Nav · contest set</p><div class="cluster" style="margin-top:4px;gap:12px">${[["dashboard"],["trophy"],["rank"],["code"],["flame"],["ac"],["wa"],["users"],["terminal"]].map(([n]) => `<span title="${n}" style="color:var(--primary)">${icon(n, 22)}</span>`).join("")}</div></article>
      <article class="card"><p class="component-label">Motifs · letters · clock · tiers · strip</p>
        <div class="cluster" style="margin-bottom:12px">${problemLetter("A","solved")}${problemLetter("B","solved")}${problemLetter("C")}${problemLetter("D","failed")}${problemLetter("E")}<span class="clock-chip">01:42:08</span><span class="rank-chip tier-5"><i></i>tier 5</span></div>
        ${scoreboardStrip([["rank", "#12"],["score", "742"],["penalty", "1240"],["verdict", "AC × 4"]])}
      </article>
      <div class="grid-2">
        <article class="card"><p class="component-label">Stat/Rating</p><p class="stat-label">NCC_DSA rating</p><p class="stat-value num">4.27 / 5.00</p><div style="margin-top:8px">${stars(4.27)}</div><p class="stat-hint up">+0.32 this period</p></article>
        <article class="card"><p class="component-label">Stat/Streak</p><p class="stat-label">AC streak</p><p class="stat-value num">${icon("flame", 22)} 12 days</p><p class="stat-hint">Longest · 21 days</p></article>
      </div>
      <article class="card"><p class="component-label">Table/ContestResult · selected and current-user rows</p>${smartTable(["Rank", "Participant", "Handle", "Score", "Penalty"], [{ cells: ["#11", "Abel Girma", "abel_g", "760", "1120"], className: "is-selected" }, { cells: ["#12", "Ibrahim Kedir", "ibrahimkediramdela2211", "742", "1240"], className: "is-me" }])}</article>
      <div class="grid-2">
        <div class="stack"><p class="component-label">Toast</p>${[["ok", "Announcement published"], ["bad", "Failed to publish announcement"], ["warn", "Rating is approaching the restriction threshold"], ["", "Contest results are being processed"]].map(([t, m]) => `<div class="toast ${t}"><div><strong>${m}</strong></div></div>`).join("")}</div>
        <div><p class="component-label">Modal/Confirmation</p><div class="modal" style="width:100%"><h2>Delete announcement?</h2><p>This action cannot be undone.</p><div class="modal-actions">${btn("Cancel", { variant: "outline" })}${btn("Delete", { variant: "danger" })}</div></div></div>
      </div>
      <article class="card"><p class="component-label">Pagination · Skeleton · OTP</p><div class="stack">${pager("Showing 21–40 of 124")}<div class="skeleton sk-lg"></div><div class="skeleton"></div>${otp(4, "Sample code")}</div></article>
    </div>`;
  },
});

addScreen({
  id: "responsive", order: 2800, group: "28 Responsive design", title: "Behavior by width",
  note: "Use the width control to preview any screen. These are the layout rules.",
  links: [["Dashboard", "dashboard"], ["Mobile navigation", "mobile-nav"]],
  render() {
    const rules = [
      ["1440 Desktop", "Sidebar fixed at 248px. Tables. Two-column forms. Auth brand panel visible."],
      ["1280 Laptop", "Same structure. Stats wrap if five columns no longer fit."],
      ["768 Tablet", "Sidebar becomes a drawer. Tables become cards. Forms become one column."],
      ["390 Mobile", "Drawer, single column, modal as a bottom sheet, 44px code boxes, primary actions full width in forms."],
    ];
    return `<div class="spec-board"><p class="kicker">Responsive</p><h1>Width changes the layout</h1><div class="grid-2">${rules.map(([t, b]) => `<article class="card"><h3>${t}</h3><p class="secondary" style="margin-top:6px">${b}</p></article>`).join("")}</div>
      <article class="card stack"><h2>What changes</h2><p>Navigation: sidebar to drawer, opened from the menu button.</p><p>Tables: card list under 800px, with the column name on each line.</p><p>Cards and forms: one column. Page padding 32 → 16.</p><p>Modals: centered on desktop, bottom sheet on a phone.</p><p>Buttons: keep 32 / 40 / 48 heights. Form submits stretch to the card width.</p></article>
    </div>`;
  },
});

addScreen({
  id: "mobile-nav", order: 2810, group: "28 Responsive design", title: "Mobile navigation open",
  note: "Preview at 390. The drawer is open.",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", navOpen: true, crumbs: [["Dashboard"]], content: pageHead("Welcome back, Ibrahim", "The menu covers the page until it is closed.") + `<article class="card"><p>Tap the dimmed area or a destination to leave the menu.</p></article>` });
  },
});

function flow(steps) {
  return `<div class="flow">${steps.map((s, i) => `${i ? '<div class="flow-arrow"></div>' : ""}<a class="flow-step" data-nav="${s[1]}" href="#${s[1]}">${s[0]}<small>${s[2] || ""}</small></a>`).join("")}</div>`;
}

addScreen({
  id: "user-flow", order: 2900, group: "29 User flow", title: "User journey",
  links: [["Login", "login"], ["Dashboard", "dashboard"]],
  render() {
    const steps = [["Register", "register"], ["Login", "login"], ["User dashboard", "dashboard"], ["Announcement", "announcements"], ["Lecture", "lecture-detail"], ["Attendance", "attendance-code"], ["Create / join team", "teams"], ["Individual contest", "contest-detail"], ["Team week contest", "team-contest-active"], ["Team results", "team-results"], ["Progress", "progress"], ["Problem verify", "verify-ok"], ["Rating", "rating"], ["Individual streak", "streak"], ["Team streak", "team-streak"], ["Restriction", "restricted"], ["Admin reopen", "admin-reopen"]];
    return `<div class="spec-board"><p class="kicker">User flow</p><h1>Individual and Group paths on one account</h1><p class="secondary">Learning stays shared. Competition splits into personal rounds and week-long team contests.</p>${flow(steps)}</div>`;
  },
});

addScreen({
  id: "admin-flow", order: 3000, group: "30 Admin flow", title: "Admin journey",
  links: [["Admin login", "admin-login"], ["Admin dashboard", "admin-dashboard"]],
  render() {
    return `<div class="spec-board"><p class="kicker">Admin flow</p><h1>Run the platform from one shell</h1>
      ${flow([["Admin login", "admin-login"], ["Admin dashboard", "admin-dashboard"], ["Manage users", "admin-users"]])}
      <div class="flow-branch" style="margin-top:16px">
        ${[["Lectures", "admin-lectures"], ["Start attendance", "admin-attendance-start"], ["Announcements", "admin-announcements"], ["Teams", "admin-teams"], ["Contests", "admin-contests"], ["Fetch Codeforces", "admin-results"], ["Publish results", "admin-results-publish"], ["Problems", "admin-problems"], ["Progress", "admin-progress"], ["Rating", "admin-rating"], ["Restricted users", "admin-restricted"], ["Reopen account", "admin-reopen"]].map(([t, id]) => `<a class="flow-step" data-nav="${id}" href="#${id}">${t}</a>`).join("")}
      </div>
    </div>`;
  },
});

addScreen({
  id: "prototype", order: 3100, group: "31 Prototype", title: "Prototype map",
  render() {
    const rows = [...SCREENS].filter((s) => s.links && s.links.length).sort((a, b) => a.order - b.order).map((s) => `<div class="list-row"><div><strong>${s.title}</strong><div class="caption">${s.group}</div></div><div class="cluster">${s.links.map(([label, id]) => `<a class="btn btn-outline btn-sm" data-nav="${id}" href="#${id}">${label}</a>`).join("")}</div></div>`).join("");
    return `<div class="spec-board"><p class="kicker">Prototype</p><h1>Where each control goes</h1><p class="secondary">Buttons inside screens navigate. This list is the same map.</p><article class="card">${rows}</article></div>`;
  },
});

addScreen({
  id: "states", order: 2700, group: "27 Error and empty states", title: "State index",
  links: [["Network", "network-error"], ["Empty announcements", "announcements-empty"], ["Verification failed", "verify-fail"]],
  render() {
    const items = [
      ["No announcements yet.", "announcements-empty"],
      ["No lectures available.", "lectures-empty"],
      ["No contests available.", "contests-empty"],
      ["No results available yet.", "results-empty"],
      ["No problems found.", "problems-empty"],
      ["No verified problems yet.", "progress-empty"],
      ["No rating history yet.", "rating-empty"],
      ["Something went wrong.", "network-error"],
      ["Unauthorized.", "unauthorized"],
      ["Session expired.", "session-expired"],
      ["Not found.", "not-found"],
      ["Forbidden.", "forbidden"],
    ];
    return `<div class="spec-board"><p class="kicker">States</p><h1>Empty, error, and system screens</h1><div class="grid-2">${items.map(([t, id]) => `<a class="card" data-nav="${id}" href="#${id}" style="text-decoration:none;color:inherit"><strong>${t}</strong><div class="caption">Open screen</div></a>`).join("")}</div></div>`;
  },
});

addScreen({
  id: "network-error", order: 2710, group: "27 Error and empty states", title: "Network and server error",
  links: [["Try again", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", crumbs: [["Dashboard"]], content: `<div class="card status-panel"><h2>Something went wrong</h2><p class="secondary">We couldn't load this information.</p>${btn("Try again", { nav: "dashboard" })}</div>` });
  },
});

addScreen({
  id: "not-found", order: 2720, group: "27 Error and empty states", title: "Not found",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", crumbs: [["Not found"]], content: `<div class="card status-panel"><h2>Page not found</h2><p class="secondary">That link does not match a page in NCC_DSA.</p>${btn("Back to dashboard", { variant: "outline", nav: "dashboard" })}</div>` });
  },
});

addScreen({
  id: "forbidden", order: 2730, group: "27 Error and empty states", title: "Forbidden",
  links: [["Dashboard", "dashboard"]],
  render() {
    return appShell({ active: "dashboard", crumbs: [["Forbidden"]], content: `<div class="card status-panel"><h2>You do not have access</h2><p class="secondary">This area is limited to administrators.</p>${btn("Back to dashboard", { variant: "outline", nav: "dashboard" })}</div>` });
  },
});
