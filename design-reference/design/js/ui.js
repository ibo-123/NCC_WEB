const SCREENS = [];
const STATE = { topic: "dp" };

function addScreen(screen) { SCREENS.push(screen); }
function getScreen(id) { return SCREENS.find((s) => s.id === id); }
function screenGroups() {
  const groups = [];
  [...SCREENS].filter((s) => !s.hidden).sort((a, b) => a.order - b.order).forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) { g = { name: s.group, items: [] }; groups.push(g); }
    g.items.push(s);
  });
  return groups;
}

/* Sharp contest-board glyphs — square caps, 1.5 stroke, geometric. */
const PATHS = {
  dashboard: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 8H4c0-2 2-3 2-8"/><path d="M10 20h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  logout: '<path d="M10 5H5v14h5"/><path d="M12 12h9"/><path d="m17 8 4 4-4 4"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"/>',
  megaphone: '<path d="M4 10h3l11-5v14L7 14H4z"/><path d="M7 14v5h3"/>',
  book: '<path d="M5 4h13v16H7a2 2 0 0 1-2-2V4z"/><path d="M5 18h12"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  ac: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="m7 12 3.5 3.5L17 9"/>',
  wa: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 8l8 8M16 8l-8 8"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v1a3 3 0 0 0 3 3"/><path d="M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 13v3M9 20h6M10 17h4"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v5M12 17.5v.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  users: '<circle cx="9" cy="8" r="2.8"/><path d="M3.5 20c1.2-3.2 3.2-4.8 5.5-4.8S13.3 16.8 14.5 20"/><circle cx="17" cy="9" r="2.2"/><path d="M15.5 14.8c1.8.3 3.3 1.4 4.5 3.2"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  link: '<path d="M9 12a4 4 0 0 0 5.7.4l2-2a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M15 12a4 4 0 0 0-5.7-.4l-2 2a4 4 0 0 0 5.7 5.7l1-1"/>',
  info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8v.5"/>',
  flame: '<path d="M12 3c0 3 2 4 2 7a4 4 0 1 1-8 0c0-2 1-3.5 2-5 0 2 1 3 1 3S10 5 12 3z"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3 7.5 8 9 5-1.5 8-4.5 8-9V6l-8-3z"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.2-5.5"/><path d="M20 4v5h-5"/>',
  star: '<path d="m12 3 2.2 5.3H20l-4.4 3.4 1.7 5.3L12 14.5 6.7 17l1.7-5.3L4 8.3h5.8L12 3z"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  hash: '<path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="m7 10 3 2-3 2M12 14h5"/>',
  rank: '<path d="M4 20h16M7 20V11M12 20V4M17 20v-6"/>',
  bracket: '<path d="M8 4H5v16h3M16 4h3v16h-3"/>',
};

function icon(name, size = 20) {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${PATHS[name] || ""}</svg>`;
}

function brandMark(size = 36, variant = "box") {
  const cls = variant === "hero" ? "mark mark-hero" : "mark";
  return `<span class="${cls}" aria-hidden="true"><img src="assets/ncc-logo.png" width="${size}" height="${size}" alt="" /></span>`;
}

function badge(kind, label) {
  return `<span class="badge badge-${kind}"><i></i>${label}</span>`;
}

/** Five-slot rating meter (contest board) — replaces soft star glyphs. */
function stars(value) {
  const v = Math.max(0, Math.min(5, Number(value)));
  const slots = [0, 1, 2, 3, 4].map((i) => {
    const fill = Math.max(0, Math.min(1, v - i));
    return `<span class="meter-slot"><span class="meter-fill" style="width:${(fill * 100).toFixed(0)}%"></span></span>`;
  }).join("");
  return `<span class="rating-meter" role="img" aria-label="${v.toFixed(2)} out of 5">${slots}<span class="meter-label mono">${v.toFixed(2)}</span></span>`;
}

function bar(pct) {
  const n = Math.max(0, Math.min(100, pct));
  return `<div class="bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100"><span style="width:${n}%"></span></div>`;
}

function btn(label, o = {}) {
  const cls = `btn btn-${o.variant || "primary"} btn-${o.size || "md"}${o.block ? " btn-block" : ""}`;
  const inner = o.loading ? `<span class="spinner" aria-hidden="true"></span><span>${label}</span>` : `${o.icon ? icon(o.icon, 16) : ""}${label}`;
  const dis = o.disabled ? 'aria-disabled="true"' : "";
  if (o.nav) return `<a class="${cls}" data-nav="${o.nav}" href="#${o.nav}" ${dis}>${inner}</a>`;
  return `<button type="${o.type || "button"}" class="${cls}" ${o.disabled ? "disabled" : ""} ${o.action ? `data-action="${o.action}"` : ""}>${inner}</button>`;
}

function field(opts) {
  const id = opts.id || `f-${Math.random().toString(36).slice(2, 8)}`;
  const state = opts.error ? "error" : opts.success ? "success" : "";
  const invalid = opts.error ? 'aria-invalid="true"' : "";
  let control = "";
  if (opts.type === "textarea") {
    control = `<textarea class="control" id="${id}" rows="${opts.rows || 5}" ${opts.disabled ? "disabled" : ""} ${invalid}>${opts.value || ""}</textarea>`;
  } else if (opts.type === "select") {
    control = `<select class="control" id="${id}" ${opts.disabled ? "disabled" : ""}>${(opts.options || []).map((o) => `<option ${o === opts.value ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  } else if (opts.type === "password") {
    control = `<div class="input-affix"><input class="control ${opts.focus ? "is-focus" : ""}" id="${id}" type="password" value="${opts.value || ""}" placeholder="${opts.placeholder || ""}" ${invalid} autocomplete="current-password" /><button type="button" class="affix-btn" data-toggle-password="${id}" aria-label="Show password" aria-pressed="false">${icon("eye", 18)}</button></div>`;
  } else {
    control = `<input class="control ${opts.focus ? "is-focus" : ""}" id="${id}" type="${opts.type || "text"}" value="${opts.value || ""}" placeholder="${opts.placeholder || ""}" ${opts.disabled ? "disabled" : ""} ${invalid} />`;
  }
  const msg = opts.error || opts.success || opts.hint;
  return `<div class="field ${state}"><label for="${id}">${opts.label}</label>${control}${msg ? `<p class="field-msg">${msg}</p>` : ""}</div>`;
}

function statusKind(status) {
  const map = { Published: "published", Draft: "draft", Active: "active", Upcoming: "upcoming", Completed: "completed", Solved: "solved", "Not solved": "unsolved", "Verification pending": "pending", "Verification failed": "failed", Restricted: "restricted", Live: "live", "Starting soon": "upcoming", Present: "solved", Missed: "failed", Open: "active", Closed: "completed", "Not submitted": "unsolved", Attended: "solved", "Not open": "draft" };
  return map[status] || "neutral";
}

function smartTable(columns, rows, minWidth = 720) {
  const head = columns.map((c) => `<th>${c}${c === "Rank" || c === "Rating" ? " ▾" : ""}</th>`).join("");
  const body = rows.map((r) => `<tr class="${r.className || ""}">${r.cells.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
  const cards = rows.map((r) => `<article class="m-card ${r.className || ""}">${r.cells.map((c, i) => `<div class="m-line"><span>${columns[i]}</span><div>${c}</div></div>`).join("")}</article>`).join("");
  return `<p class="caption scroll-hint">On a narrow screen this table is shown as cards.</p><div class="only-wide table-scroll"><table style="min-width:${minWidth}px"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><div class="only-narrow">${cards}</div>`;
}

function pager(label) {
  return `<div class="pager"><p class="caption">${label}</p><div class="pages"><a href="#" aria-label="Previous page">← Previous</a><span class="on">1</span><a href="#">2</a><a href="#">3</a><a href="#">4</a><a href="#" aria-label="Next page">Next →</a></div></div>`;
}

function crumbs(items) {
  if (!items || !items.length) return "";
  return `<nav class="crumbs" aria-label="Breadcrumb">${items.map((c, i) => (i === items.length - 1 ? `<span aria-current="page">${c[0]}</span>` : `<a class="crumb" data-nav="${c[1]}" href="#${c[1]}">${c[0]}</a><span aria-hidden="true">/</span>`)).join("")}</nav>`;
}

function searchBox(label) {
  return `<label class="search"><span class="sr-only">${label}</span>${icon("search", 18)}<input type="search" placeholder="${label}" /></label>`;
}

function menu(actions) {
  return `<div class="menu"><button type="button" class="btn btn-ghost btn-sm" data-action="menu" aria-label="Row actions">Actions</button><div class="menu-pop" role="menu">${actions.map((a) => `<a data-nav="${a[1]}" href="#${a[1]}" role="menuitem">${a[0]}</a>`).join("")}</div></div>`;
}

function modal(title, body, actions) {
  return `<div class="modal-root"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><p>${body}</p><div class="modal-actions">${actions}</div></div></div>`;
}

function toast(tone, title, body) {
  return `<div class="toaster"><div class="toast ${tone}" role="status"><div><strong>${title}</strong>${body ? `<span>${body}</span>` : ""}</div></div></div>`;
}

function emptyBlock(title, body, action) {
  return `<div class="card empty"><div style="color:var(--primary)">${icon("terminal", 28)}</div><h2>${title}</h2><p class="secondary">${body || ""}</p>${action || ""}</div>`;
}

function otp(n, label) {
  const inputs = Array.from({ length: n }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="${label} digit ${i + 1}" />`).join("");
  return `<div class="otp" role="group" aria-label="${label}">${inputs}</div>`;
}

function lineChart(points) {
  const w = 720, h = 250, pl = 36, pr = 12, pt = 16, pb = 32;
  const min = 1, max = 5;
  const iw = w - pl - pr, ih = h - pt - pb;
  const coords = points.map((p, i) => {
    const x = pl + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
    const y = pt + (1 - (p.y - min) / (max - min)) * ih;
    return [x, y];
  });
  const d = coords.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const grid = [1, 2, 3, 4, 5].map((v) => {
    const y = pt + (1 - (v - min) / (max - min)) * ih;
    return `<line x1="${pl}" x2="${w - pr}" y1="${y}" y2="${y}" stroke="var(--border)" /><text x="4" y="${y + 4}" fill="var(--muted)" font-size="11">${v.toFixed(0)}</text>`;
  }).join("");
  const labels = coords.map((c, i) => `<text x="${c[0]}" y="${h - 8}" text-anchor="middle" fill="var(--muted)" font-size="11">${points[i].x}</text>`).join("");
  const dots = coords.map((c) => `<circle cx="${c[0]}" cy="${c[1]}" r="3.5" fill="var(--primary)"/>`).join("");
  return `<figure><svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Rating from September 1 to October 9, 2026. Vertical axis is rating from 1 to 5. Horizontal axis is date.">${grid}<path d="${d}" fill="none" stroke="var(--primary)" stroke-width="2.5"/>${dots}${labels}</svg><figcaption class="caption">Horizontal axis: date. Vertical axis: NCC_DSA rating (1.00–5.00). Source: sample rating history.</figcaption></figure>`;
}

function heatCalendar() {
  const cells = DATA.heat.map((n) => `<i class="h${n}"></i>`).join("");
  return `<div><div class="cal" role="img" aria-label="Daily qualifying activity. Older days are on the left.">${cells}</div><div class="legend" style="margin-top:8px"><span>Less</span><i style="background:var(--heat-0)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-4)"></i><span>More</span></div><p class="caption" style="margin-top:6px">Each cell is a day. Filled cells have qualifying activity recorded by the platform.</p></div>`;
}

const USER_NAV = [
  { section: "Shared", items: [
    ["dashboard", "Dashboard", "dashboard"],
    ["announcements", "Announcements", "megaphone"],
    ["lectures", "Lectures", "book"],
    ["attendance", "Attendance", "ac"],
    ["progress", "Progress", "chart"],
    ["rating", "Rating", "rank"],
    ["profile", "Profile", "user"],
  ]},
  { section: "Individual", items: [
    ["contests", "Contests", "trophy"],
    ["results", "Results", "rank"],
    ["streak", "My streak", "flame"],
  ]},
  { section: "Group", items: [
    ["teams", "My team", "users"],
    ["team-contests", "Team contests", "trophy"],
    ["team-results", "Team results", "rank"],
    ["team-streak", "Team streak", "flame"],
  ]},
];

const ADMIN_NAV = [
  { section: "Overview", items: [["admin-dashboard", "Dashboard", "dashboard"]] },
  { section: "People", items: [["admin-users", "Users", "users"], ["admin-restricted", "Restricted", "lock"], ["admin-teams", "Teams", "users"]] },
  { section: "Learning", items: [["admin-announcements", "Announcements", "megaphone"], ["admin-lectures", "Lectures", "book"], ["admin-attendance", "Attendance", "ac"]] },
  { section: "Competition", items: [["admin-contests", "Contests", "trophy"], ["admin-results", "Results", "rank"]] },
  { section: "Practice", items: [["admin-problems", "Problems", "code"], ["admin-topics", "Topics", "hash"], ["admin-progress", "Progress", "chart"]] },
  { section: "Performance", items: [["admin-rating", "Rating", "rank"]] },
];

function appShell(o) {
  const role = o.role || "user";
  const groups = role === "admin" ? ADMIN_NAV : USER_NAV;
  const person = role === "admin" ? DATA.admin : DATA.user;
  const home = role === "admin" ? "admin-dashboard" : "dashboard";
  const nav = groups.map((g) => `${g.section ? `<div class="nav-section">${g.section}</div>` : ""}<div>${g.items.map(([id, label, ic]) => `<a class="nav-link${o.active === id ? " active" : ""}" data-nav="${id}" href="#${id}" ${o.active === id ? 'aria-current="page"' : ""}>${icon(ic)}${label}</a>`).join("")}</div>`).join("");
  const security = role === "admin" ? `<a class="nav-link" data-nav="admin-2fa" href="#admin-2fa">${icon("shield")}Two-factor</a>` : "";
  return `<div class="app${o.navOpen ? " nav-open" : ""}">
    <aside class="sidebar" aria-label="${role === "admin" ? "Admin" : "Main"}">
      <a class="side-head" data-nav="${home}" href="#${home}" style="text-decoration:none;color:inherit">
        ${brandMark()}
        <span><span class="brand-name">NCC_DSA</span><span class="brand-sub">${role === "admin" ? "admin" : "contest"}</span></span>
      </a>
      <nav>${nav}</nav>
      <div class="side-foot">
        ${security}
        <div class="identity"><span class="avatar">${person.initials}</span><span><strong>${person.name}</strong><small>${role === "admin" ? "Admin" : "Rating " + DATA.user.rating.toFixed(2)}</small></span></div>
        <a class="nav-link" data-nav="login" href="#login">${icon("logout")}Log out</a>
      </div>
    </aside>
    <div class="scrim" data-action="close-nav"></div>
    <div class="main-col">
      <header class="topbar">
        <button type="button" class="menu-btn" data-action="toggle-nav" aria-label="Open navigation">${icon("menu")}</button>
        ${crumbs(o.crumbs)}
        <div class="top-actions">
          <a class="icon-btn" data-nav="${role === "admin" ? "admin-notifications" : "notifications"}" href="#notifications" aria-label="Notifications">${icon("bell")}</a>
          <a class="top-user" data-nav="${role === "admin" ? "admin-2fa" : "profile"}" href="#profile"><span class="avatar">${person.initials}</span>${person.name.split(" ")[0]}</a>
        </div>
      </header>
      <div class="content">${o.content}</div>
    </div>
    ${o.toast || ""}${o.modal || ""}${o.drawer || ""}
  </div>`;
}

function pageHead(title, desc, actions = "") {
  return `<div class="page-head"><div><h1>${title}</h1>${desc ? `<p class="secondary">${desc}</p>` : ""}</div><div class="cluster">${actions}</div></div>`;
}

function authLayout(card) {
  return `<div class="auth">
    <section class="auth-brand">
      <div>
        <div class="side-head" style="padding-left:0">${brandMark()}<span><span class="brand-name">NCC_DSA</span><span class="brand-sub" style="color:var(--brand-panel-muted)">night code club</span></span></div>
        <h2 style="margin-top:36px">Train. Contest. <span>Climb.</span></h2>
        <p style="margin-top:14px;color:var(--brand-panel-muted);max-width:36ch;line-height:1.55">Practice sheets, weekly contests, and team streaks — built for competitive programmers.</p>
        <div class="cluster" style="margin-top:22px"><span class="problem-letter solved">A</span><span class="problem-letter solved">B</span><span class="problem-letter">C</span><span class="problem-letter failed">D</span><span class="problem-letter">E</span></div>
      </div>
      <div class="brand-metrics">
        <div><span>Rating</span><span>4.27 / 5.00</span></div>
        <div><span>AC streak</span><span>12 days</span></div>
        <div><span>Solved</span><span>82 / 120</span></div>
        <div><span>Team</span><span>Binary Hawks</span></div>
      </div>
    </section>
    <section class="auth-panel"><div class="auth-card">${card}</div></section>
  </div>`;
}

function problemLetter(letter, state = "") {
  return `<span class="problem-letter ${state}">${letter}</span>`;
}

function scoreboardStrip(rows) {
  return `<div class="scoreboard-strip">${rows.map(([l, v]) => `<div><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}</div>`;
}

function tierForRating(r) {
  const n = Number(r);
  if (n >= 4.5) return 5;
  if (n >= 3.5) return 4;
  if (n >= 2.5) return 3;
  if (n >= 1.5) return 2;
  return 1;
}

function lectureRows() {
  return DATA.lectures.map((l) => `<div class="list-row"><div><strong>${l.title}</strong><div class="caption">${l.date} · ${l.time}</div><div class="cluster" style="margin-top:6px">${badge(statusKind(l.status), l.status)}</div></div>${btn("View", { variant: "outline", size: "sm", nav: l.nav })}</div>`).join("");
}

function contestRows(items) {
  return items.map((c) => `<div class="list-row"><div><strong>${c.title}</strong><div class="caption">${c.platform} · ${c.mode || "individual"} · ${c.date} · ${c.time} · ${c.duration}</div><div class="cluster" style="margin-top:6px">${badge(statusKind(c.status), c.status)}${c.mode === "team" ? badge("info", "Team") : badge("published", "Individual")}${c.invited ? badge("info", "Invited") : ""}</div></div>${btn(c.status === "Completed" ? "View results" : "Open", { variant: "outline", size: "sm", nav: c.status === "Completed" ? (c.mode === "team" ? "team-results" : "results") : c.nav })}</div>`).join("");
}

function modeTabs(active) {
  const tabs = [["Individual", "contests"], ["Group", "team-contests"]];
  return `<div class="cluster" role="tablist" aria-label="Competition mode">${tabs.map(([label, id]) => `<a class="btn ${active === id ? "btn-primary" : "btn-outline"} btn-sm" data-nav="${id}" href="#${id}" role="tab" aria-selected="${active === id}">${label}</a>`).join("")}</div>`;
}
