function teamContestBody(mode) {
  const map = {
    detail: DATA.teamContests.find((c) => c.status === "Upcoming"),
    active: DATA.teamContests.find((c) => c.status === "Active"),
    done: DATA.teamContests.find((c) => c.status === "Completed"),
  };
  const c = map[mode];
  const done = mode === "done";
  const active = mode === "active";
  return appShell({
    active: "team-contests",
    crumbs: [["Team contests", "team-contests"], [c.title]],
    content: `${pageHead(c.title, "Group mode · Codeforces · 7 days")}<div class="cluster">${badge(statusKind(c.status), c.status)}${badge("info", "Team")}${badge("published", "Week window")}</div>
      <article class="card important stack"><p class="kicker">Team competition</p><h2>${c.title}</h2><p>Platform: Codeforces<br>Window: ${c.date} · ${c.duration}<br>Your team: <strong>${DATA.team.name}</strong></p>${done ? btn("View team results", { nav: "team-results" }) : `<a class="btn btn-primary btn-md" href="https://codeforces.com/contest/${c.id}">Open on Codeforces</a>`}</article>
      <div class="grid-2">
        <article class="card stack"><h2>About</h2><p>A week-long Group contest. After the window closes, admins fetch Codeforces standings for every linked member handle, then publish team ranks derived from those rows.</p><dl class="kv"><dt>Mode</dt><dd>Team</dd><dt>Platform</dt><dd>Codeforces</dd><dt>Contest ID</dt><dd class="mono">${c.id}</dd><dt>Duration</dt><dd>7 days (10080 minutes)</dd><dt>Team</dt><dd>${DATA.team.name}</dd></dl></article>
        <article class="card stack"><h2>Your team</h2>${active || done ? `<p>Members matched after fetch appear on the results page.</p><p class="secondary">${DATA.team.memberCount} members · invite <span class="mono">${DATA.team.inviteCode}</span></p>${done ? `<p>Team rank <strong class="num">#1</strong></p><p>Team points <strong class="num">2840</strong></p>${btn("View team results", { variant: "outline", nav: "team-results" })}` : `<p class="secondary">${active ? "The week is in progress. Team standings appear after publish." : "Results appear after the week is published."}</p>`}` : `<p class="secondary">Results appear after the week is published.</p>`}</article>
      </div>`,
  });
}

addScreen({
  id: "teams", order: 905, group: "09b Teams", title: "My team",
  links: [["Create team", "team-create"], ["Join team", "team-join"], ["No team", "team-empty"], ["Team contests", "team-contests"]],
  render() {
    const t = DATA.team;
    return appShell({
      active: "teams",
      crumbs: [["My team"]],
      content: pageHead("My team", "Group mode. One active team per student.") + `
        <article class="card stack">
          <div class="spread"><div><p class="kicker">Active team</p><h2>${t.name}</h2><p class="caption">Slug · ${t.slug}</p></div>${badge("active", "Active")}</div>
          <dl class="kv"><dt>Invite code</dt><dd class="mono">${t.inviteCode}</dd><dt>Captain</dt><dd>${t.captain}</dd><dt>Members</dt><dd>${t.memberCount} / ${t.maxMembers}</dd><dt>Team streak</dt><dd>${t.streak} days · longest ${t.longest}</dd></dl>
          <div class="cluster">${btn("Team contests", { nav: "team-contests" })}${btn("Team streak", { variant: "outline", nav: "team-streak" })}${btn("Leave team", { variant: "danger", size: "sm", nav: "team-leave" })}</div>
        </article>
        <article class="card"><h2>Members</h2>${smartTable(["Name", "Role", "Codeforces"], t.members.map((m) => ({ cells: [m.name, m.role, `<span class="mono">${m.cf}</span>`] })), 520)}</article>`,
    });
  },
});

addScreen({
  id: "team-create", order: 906, group: "09b Teams", title: "Create team",
  links: [["My team", "teams"]],
  render() {
    return appShell({
      active: "teams",
      crumbs: [["My team", "teams"], ["Create"]],
      content: pageHead("Create a team", "You become the captain. Share the invite code with up to four teammates.") + `<form class="card stack" style="max-width:520px">${field({ label: "Team name", placeholder: "Binary Hawks" })}<p class="caption">Max members · 5 (proposed). One active team per student.</p>${btn("Create team", { nav: "teams" })}</form>`,
    });
  },
});

addScreen({
  id: "team-join", order: 907, group: "09b Teams", title: "Join team",
  links: [["My team", "teams"]],
  render() {
    return appShell({
      active: "teams",
      crumbs: [["My team", "teams"], ["Join"]],
      content: pageHead("Join with invite code") + `<form class="card stack" style="max-width:520px">${field({ label: "Invite code", placeholder: "HAWK7K2M", value: "" })}${btn("Join team", { nav: "teams" })}</form>`,
    });
  },
});

addScreen({
  id: "team-empty", order: 908, group: "09b Teams", title: "No team",
  links: [["Create", "team-create"], ["Join", "team-join"]],
  render() {
    return appShell({
      active: "teams",
      crumbs: [["My team"]],
      content: pageHead("My team") + emptyBlock("You are not on a team yet.", "Create a team or join with an invite code to enter Group contests.", `<div class="cluster" style="justify-content:center;margin-top:12px">${btn("Create team", { nav: "team-create" })}${btn("Join team", { variant: "outline", nav: "team-join" })}</div>`),
    });
  },
});

addScreen({
  id: "team-leave", order: 909, group: "09b Teams", title: "Leave team",
  links: [["Cancel", "teams"], ["Empty", "team-empty"]],
  render() {
    return appShell({
      active: "teams",
      crumbs: [["My team", "teams"]],
      content: pageHead("My team"),
      modal: modal("Leave team?", "You will leave Binary Hawks. Captains with other members must transfer captaincy or disband first.", `${btn("Cancel", { variant: "outline", nav: "teams" })}${btn("Leave team", { variant: "danger", nav: "team-empty" })}`),
    });
  },
});

addScreen({
  id: "team-contests", order: 910, group: "09b Teams", title: "Team contests",
  links: [["Upcoming", "team-contest-detail"], ["Active week", "team-contest-active"], ["Completed", "team-contest-done"], ["Individual contests", "contests"]],
  render() {
    const groups = [["Upcoming", DATA.teamContests.filter((c) => c.status === "Upcoming")], ["Active", DATA.teamContests.filter((c) => c.status === "Active")], ["Completed", DATA.teamContests.filter((c) => c.status === "Completed")]];
    return appShell({
      active: "team-contests",
      crumbs: [["Team contests"]],
      content: pageHead("Team contests", "Week-long Group rounds on Codeforces. Standings are fetched after the window ends.") + modeTabs("team-contests") + groups.map(([name, items]) => `<section class="stack"><h2>${name}</h2>${items.length ? `<div class="grid-2">${items.map((c) => `<article class="card stack"><div class="cluster">${badge(statusKind(c.status), c.status)}${badge("info", "Team")}</div><h3>${c.title}</h3><p class="caption">${c.platform} · ${c.duration}<br>${c.date}</p>${btn(c.status === "Completed" ? "View results" : "Open", { variant: "outline", size: "sm", nav: c.status === "Completed" ? "team-results" : c.nav })}</article>`).join("")}</div>` : `<p class="secondary">No ${name.toLowerCase()} team contests.</p>`}</section>`).join(""),
    });
  },
});

addScreen({ id: "team-contest-detail", order: 911, group: "09b Teams", title: "Team contest details", links: [["List", "team-contests"], ["Active", "team-contest-active"]], render: () => teamContestBody("detail") });
addScreen({ id: "team-contest-active", order: 912, group: "09b Teams", title: "Active team week", links: [["List", "team-contests"]], render: () => teamContestBody("active") });
addScreen({ id: "team-contest-done", order: 913, group: "09b Teams", title: "Completed team week", links: [["Results", "team-results"]], render: () => teamContestBody("done") });

addScreen({
  id: "team-results", order: 1005, group: "10 Contest results", title: "Team standings",
  links: [["Team contest", "team-contest-done"], ["Member rows", "team-results-members"]],
  render() {
    const rows = DATA.teamBoard.map((r) => ({ className: r[1] === "Binary Hawks" ? "is-me" : "", cells: [`#${r[0]}`, r[1], `<span class="num">${r[2]}</span>`, r[3], r[4]] }));
    return appShell({
      active: "team-results",
      crumbs: [["Team results"]],
      content: pageHead("Team Week #05 — Binary Search", "Completed · derived team ranks after Codeforces fetch") + `<div class="grid-3"><article class="card mini"><p class="stat-label">Your team rank</p><p class="stat-value num">#1</p></article><article class="card mini"><p class="stat-label">Team points</p><p class="stat-value num">2840</p></article><article class="card mini"><p class="stat-label">Members matched</p><p class="stat-value num">4/4</p></article></div><p class="secondary">Team points are derived from member Codeforces rows. The aggregation rule is configured by the platform; member source ranks stay visible.</p>${smartTable(["Rank", "Team", "Points", "Penalty", "Matched"], rows, 720)}${btn("View member rows", { variant: "outline", nav: "team-results-members" })}`,
    });
  },
});

addScreen({
  id: "team-results-members", order: 1006, group: "10 Contest results", title: "Team member results",
  links: [["Team standings", "team-results"]],
  render() {
    const rows = [
      ["Ibrahim Kedir", "ibrahimkediramdela2211", "820", "210"],
      ["Hana Tesfaye", "hana_t", "790", "180"],
      ["Yonas Alemu", "yonas_a", "720", "240"],
      ["Meron Bekele", "meron_b", "510", "300"],
    ].map((r) => ({ className: r[0] === "Ibrahim Kedir" ? "is-me" : "", cells: [r[0], `<span class="mono">${r[1]}</span>`, r[2], r[3]] }));
    return appShell({
      active: "team-results",
      crumbs: [["Team results", "team-results"], ["Binary Hawks"]],
      content: pageHead("Binary Hawks — member rows", "Source Codeforces data for this team week.") + smartTable(["Member", "Handle", "Points", "Penalty"], rows, 640),
    });
  },
});

addScreen({
  id: "team-streak", order: 1410, group: "14 Streak", title: "Team streak",
  links: [["Individual streak", "streak"], ["My team", "teams"]],
  render() {
    const t = DATA.team;
    return appShell({
      active: "team-streak",
      crumbs: [["Team streak"]],
      content: pageHead("Team streak", `${t.name} · separate from your individual streak.`) + `<div class="cluster">${btn("Individual streak", { variant: "outline", size: "sm", nav: "streak" })}</div><div class="grid-2"><article class="card"><p class="stat-label">Current team streak</p><p class="stat-value">${t.streak} days</p></article><article class="card"><p class="stat-label">Longest team streak</p><p class="stat-value">${t.longest} days</p></article></div><article class="card stack"><h2>Team activity</h2><p class="secondary">A team day counts when the platform records qualifying team activity. Exact qualifying actions wait on B5/B25.</p>${heatCalendar()}</article>`,
    });
  },
});

addScreen({
  id: "admin-teams", order: 1750, group: "17 Admin users", title: "Admin teams",
  links: [["Team detail", "admin-team"], ["Disband", "admin-team-disband"]],
  render() {
    const rows = [
      ["Binary Hawks", "Ibrahim Kedir", "4", "8 days", "Active"],
      ["Stack Overflowers", "Hana Tesfaye", "5", "11 days", "Active"],
      ["Null Pointers", "Yonas Alemu", "4", "3 days", "Active"],
    ].map((r) => ({ cells: [r[0], r[1], r[2], r[3], badge("active", r[4]), `<div class="cluster">${btn("View", { size: "sm", variant: "outline", nav: "admin-team" })}${btn("Disband", { size: "sm", variant: "danger", nav: "admin-team-disband" })}</div>`] }));
    return appShell({ role: "admin", active: "admin-teams", crumbs: [["Teams"]], content: pageHead("Teams", "Student-created groups for week-long Codeforces competition.") + `<div class="toolbar">${searchBox("Search teams")}</div>` + smartTable(["Team", "Captain", "Members", "Streak", "Status", "Actions"], rows, 860) });
  },
});

addScreen({
  id: "admin-team", order: 1755, group: "17 Admin users", title: "Admin team detail",
  links: [["Teams", "admin-teams"]],
  render() {
    const t = DATA.team;
    return appShell({ role: "admin", active: "admin-teams", crumbs: [["Teams", "admin-teams"], [t.name]], content: pageHead(t.name, `Invite ${t.inviteCode}`) + `<div class="grid-2"><article class="card stack"><h2>Team</h2><dl class="kv"><dt>Captain</dt><dd>${t.captain}</dd><dt>Members</dt><dd>${t.memberCount} / ${t.maxMembers}</dd><dt>Streak</dt><dd>${t.streak} · longest ${t.longest}</dd></dl></article><article class="card stack"><h2>Members</h2>${t.members.map((m) => `<div class="list-row"><span>${m.name}</span><span class="caption">${m.role} · ${m.cf}</span></div>`).join("")}</article></div>` });
  },
});

addScreen({
  id: "admin-team-disband", order: 1760, group: "17 Admin users", title: "Disband team",
  links: [["Teams", "admin-teams"]],
  render() {
    return appShell({
      role: "admin",
      active: "admin-teams",
      crumbs: [["Teams"]],
      content: pageHead("Teams"),
      modal: modal("Disband team?", "Binary Hawks will be disbanded. Members lose their active membership. Past TeamContestResult rows stay for history.", `${btn("Cancel", { variant: "outline", nav: "admin-teams" })}${btn("Disband", { variant: "danger", nav: "admin-teams" })}`),
    });
  },
});
