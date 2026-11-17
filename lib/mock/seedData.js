/**
 * Realistic initial client-side sample dataset aligned with docs/API_CONTRACT.md DTOs
 * and design-reference/design/js/data.js.
 */

function buildHeatmapCells() {
  const cells = [];
  const start = new Date("2026-06-08T00:00:00Z");
  for (let i = 0; i < 18 * 7; i += 1) {
    const d = new Date(start.getTime() + i * 86400000);
    const day = i % 7;
    const week = Math.floor(i / 7);
    const n = (week * 3 + day * 5) % 9;
    let level = 0;
    if (n >= 2 && n < 4) level = 1;
    else if (n >= 4 && n < 6) level = 2;
    else if (n >= 6 && n < 8) level = 3;
    else if (n >= 8) level = 4;
    cells.push({
      date: d.toISOString().slice(0, 10),
      level,
      count: level === 0 ? 0 : level + (week % 2),
    });
  }
  return cells;
}

function buildTeamHeatmapCells() {
  return buildHeatmapCells().map((c, i) => {
    const lvl = i % 5 === 0 ? 0 : Math.min(4, Math.max(0, c.level - ((i + 1) % 2)));
    return { ...c, level: lvl, count: lvl };
  });
}

export function createInitialStore() {
  const users = [
    {
      id: "u-ibrahim",
      name: "Ibrahim Kedir",
      email: "ibrahim.kedir@ncc.edu",
      role: "student",
      status: "active",
      rating: 4.27,
      handles: { codeforces: "ibrahimkediramdela2211", leetcode: "ibro_man" },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-13T08:15:00Z",
      createdAt: "2026-08-20T09:00:00Z",
      attendedCount: 41,
      twoFactorEnabled: false,
    },
    {
      id: "u-hana",
      name: "Hana Tesfaye",
      email: "hana.tesfaye@ncc.edu",
      role: "student",
      status: "active",
      rating: 4.62,
      handles: { codeforces: "hana_t", leetcode: "hana_lc" },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-13T09:05:00Z",
      createdAt: "2026-08-20T09:05:00Z",
      attendedCount: 43,
      twoFactorEnabled: false,
    },
    {
      id: "u-yonas",
      name: "Yonas Alemu",
      email: "yonas.alemu@ncc.edu",
      role: "student",
      status: "active",
      rating: 4.41,
      handles: { codeforces: "yonas_a", leetcode: "yonas_lc" },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-12T17:30:00Z",
      createdAt: "2026-08-21T10:00:00Z",
      attendedCount: 40,
      twoFactorEnabled: false,
    },
    {
      id: "u-meron",
      name: "Meron Bekele",
      email: "meron.bekele@ncc.edu",
      role: "student",
      status: "active",
      rating: 3.88,
      handles: { codeforces: "meron_b", leetcode: null },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-12T14:20:00Z",
      createdAt: "2026-08-22T11:00:00Z",
      attendedCount: 36,
      twoFactorEnabled: false,
    },
    {
      id: "u-liya",
      name: "Liya Mekonnen",
      email: "liya.mekonnen@ncc.edu",
      role: "student",
      status: "restricted",
      rating: 1.84,
      handles: { codeforces: "liya_m", leetcode: null },
      restrictedAt: "2026-10-03T12:00:00Z",
      restrictedReason: "Rating fell below threshold during term review.",
      lastLoginAt: "2026-10-11T09:10:00Z",
      createdAt: "2026-08-23T09:30:00Z",
      attendedCount: 28,
      twoFactorEnabled: false,
    },
    {
      id: "u-dawit",
      name: "Dawit Haile",
      email: "dawit.haile@ncc.edu",
      role: "student",
      status: "active",
      rating: 3.54,
      handles: { codeforces: "dawit_h", leetcode: "dawit_lc" },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-12T10:40:00Z",
      createdAt: "2026-08-24T08:00:00Z",
      attendedCount: 38,
      twoFactorEnabled: false,
    },
    {
      id: "u-sara",
      name: "Sara Mohammed",
      email: "sara.mohammed@ncc.edu",
      role: "student",
      status: "active",
      rating: 4.05,
      handles: { codeforces: "sara_m", leetcode: null },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-13T07:50:00Z",
      createdAt: "2026-08-25T13:00:00Z",
      attendedCount: 41,
      twoFactorEnabled: false,
    },
    {
      id: "u-marta",
      name: "Marta Alemu",
      email: "marta.alemu@ncc.edu",
      role: "admin",
      status: "active",
      rating: null,
      handles: { codeforces: null, leetcode: null },
      restrictedAt: null,
      restrictedReason: null,
      lastLoginAt: "2026-10-13T09:10:00Z",
      createdAt: "2026-08-15T08:00:00Z",
      attendedCount: 0,
      twoFactorEnabled: false,
    },
  ];

  const teams = [
    {
      id: "team-1",
      name: "Binary Hawks",
      slug: "binary-hawks",
      inviteCode: "HAWK7K2M",
      captainId: "u-ibrahim",
      status: "active",
      maxMembers: 5,
      streak: { current: 8, longest: 14 },
      members: [
        { userId: "u-ibrahim", name: "Ibrahim Kedir", role: "captain", handles: { codeforces: "ibrahimkediramdela2211" }, joinedAt: "2026-09-01T10:00:00Z" },
        { userId: "u-hana", name: "Hana Tesfaye", role: "member", handles: { codeforces: "hana_t" }, joinedAt: "2026-09-01T11:20:00Z" },
        { userId: "u-yonas", name: "Yonas Alemu", role: "member", handles: { codeforces: "yonas_a" }, joinedAt: "2026-09-02T09:15:00Z" },
        { userId: "u-meron", name: "Meron Bekele", role: "member", handles: { codeforces: "meron_b" }, joinedAt: "2026-09-03T14:00:00Z" },
      ],
    },
    {
      id: "team-2",
      name: "Stack Overflowers",
      slug: "stack-overflowers",
      inviteCode: "STCK9P4R",
      captainId: "u-dawit",
      status: "active",
      maxMembers: 5,
      streak: { current: 11, longest: 16 },
      members: [
        { userId: "u-dawit", name: "Dawit Haile", role: "captain", handles: { codeforces: "dawit_h" }, joinedAt: "2026-09-01T12:00:00Z" },
        { userId: "u-sara", name: "Sara Mohammed", role: "member", handles: { codeforces: "sara_m" }, joinedAt: "2026-09-02T15:00:00Z" },
      ],
    },
  ];

  const announcements = [
    {
      id: "ann-1",
      title: "Summer tournament seating",
      body: "Arrive 20 minutes early for NCC_DSA Summer Time Tournament check-in. Bring the Codeforces handle linked on your profile.",
      type: "important",
      status: "published",
      publishedAt: "2026-10-11T09:00:00Z",
      createdAt: "2026-10-11T08:45:00Z",
      updatedAt: "2026-10-11T09:00:00Z",
      createdBy: "Marta Alemu",
      relatedHref: "/contests/con-3",
    },
    {
      id: "ann-2",
      title: "Weekly Contest #04 invitation",
      body: "You are invited to NCC_DSA Weekly Contest #04 on Sunday at 3:30 PM. The contest runs on Codeforces.",
      type: "contest",
      status: "published",
      publishedAt: "2026-10-10T14:00:00Z",
      createdAt: "2026-10-10T13:30:00Z",
      updatedAt: "2026-10-10T14:00:00Z",
      createdBy: "Marta Alemu",
      relatedHref: "/contests/con-1",
    },
    {
      id: "ann-3",
      title: "Dynamic programming lecture notes",
      body: "Slides and the practice sheet for Introduction to Dynamic Programming are on the lecture page.",
      type: "lecture",
      status: "published",
      publishedAt: "2026-10-08T11:30:00Z",
      createdAt: "2026-10-08T11:00:00Z",
      updatedAt: "2026-10-08T11:30:00Z",
      createdBy: "Marta Alemu",
      relatedHref: "/lectures/lec-2",
    },
    {
      id: "ann-4",
      title: "Attendance window reminder",
      body: "Attendance codes are valid only while the session is open. Submit the 4-digit code from the lecture room.",
      type: "attendance",
      status: "published",
      publishedAt: "2026-10-06T08:00:00Z",
      createdAt: "2026-10-06T07:45:00Z",
      updatedAt: "2026-10-06T08:00:00Z",
      createdBy: "Marta Alemu",
      relatedHref: "/attendance",
    },
    {
      id: "ann-5",
      title: "Draft: Mid-term rating review window",
      body: "Draft notes for instructors ahead of the mid-term check-in.",
      type: "general",
      status: "draft",
      publishedAt: null,
      createdAt: "2026-10-13T07:00:00Z",
      updatedAt: "2026-10-13T07:00:00Z",
      createdBy: "Marta Alemu",
      relatedHref: null,
    },
  ];

  const lectures = [
    {
      id: "lec-1",
      title: "Binary Search Patterns",
      description: "Lower bound, upper bound, and the predicate form used in contest problems.",
      scheduledAt: "2026-10-13T13:00:00Z",
      liveUrl: "https://meet.ncc.edu/binary-search",
      status: "published",
      state: "Live",
      resources: [
        { title: "Lecture slides", type: "pdf", url: "https://docs.ncc.edu/binary-search-slides.pdf" },
        { title: "Practice sheet", type: "link", url: "https://codeforces.com/problemset?tags=binary+search" },
        { title: "Sample code", type: "file", url: "https://docs.ncc.edu/binary-search-templates.cpp" },
      ],
    },
    {
      id: "lec-2",
      title: "Introduction to Dynamic Programming",
      description: "States, transitions, and how to read a DP problem before coding.",
      scheduledAt: "2026-10-17T11:00:00Z",
      liveUrl: "https://meet.ncc.edu/intro-dp",
      status: "published",
      state: "Upcoming",
      resources: [
        { title: "DP state design slides", type: "pdf", url: "https://docs.ncc.edu/dp-intro.pdf" },
        { title: "Starter problems", type: "link", url: "https://codeforces.com/problemset?tags=dp" },
      ],
    },
    {
      id: "lec-3",
      title: "Graph Traversal Workshop",
      description: "BFS, DFS, and when each one is the right first move.",
      scheduledAt: "2026-10-18T07:00:00Z",
      liveUrl: "https://meet.ncc.edu/graph-workshop",
      status: "published",
      state: "Starting soon",
      resources: [
        { title: "Graph traversal notes", type: "pdf", url: "https://docs.ncc.edu/graphs.pdf" },
      ],
    },
    {
      id: "lec-4",
      title: "Arrays and Prefix Sums",
      description: "Prefix sums, difference arrays, and common contest patterns.",
      scheduledAt: "2026-10-06T13:00:00Z",
      liveUrl: "https://meet.ncc.edu/prefix-sums",
      status: "published",
      state: "Completed",
      resources: [
        { title: "Prefix sums slides", type: "pdf", url: "https://docs.ncc.edu/prefix-sums.pdf" },
        { title: "Sample code", type: "file", url: "https://docs.ncc.edu/prefix-sums.cpp" },
      ],
    },
  ];

  const attendanceSessions = [
    {
      id: "att-sess-1",
      lectureId: "lec-1",
      lectureTitle: "Binary Search Patterns",
      opensAt: "2026-10-13T08:50:00Z",
      expiresAt: "2099-10-13T09:10:00Z",
      closedAt: null,
      code: "4837",
      records: [
        { userId: "u-hana", name: "Hana Tesfaye", submittedAt: "2026-10-13T08:53:00Z" },
        { userId: "u-yonas", name: "Yonas Alemu", submittedAt: "2026-10-13T08:55:00Z" },
      ],
    },
    {
      id: "att-sess-2",
      lectureId: "lec-4",
      lectureTitle: "Arrays and Prefix Sums",
      opensAt: "2026-10-06T13:00:00Z",
      expiresAt: "2026-10-06T13:15:00Z",
      closedAt: "2026-10-06T13:15:00Z",
      code: null,
      records: [
        { userId: "u-ibrahim", name: "Ibrahim Kedir", submittedAt: "2026-10-06T13:12:00Z" },
        { userId: "u-hana", name: "Hana Tesfaye", submittedAt: "2026-10-06T13:08:00Z" },
        { userId: "u-yonas", name: "Yonas Alemu", submittedAt: "2026-10-06T13:09:00Z" },
      ],
    },
    {
      id: "att-sess-3",
      lectureId: "lec-3",
      lectureTitle: "Graph Traversal Workshop (Prep)",
      opensAt: "2026-09-28T07:00:00Z",
      expiresAt: "2026-09-28T07:15:00Z",
      closedAt: "2026-09-28T07:15:00Z",
      code: null,
      records: [
        { userId: "u-ibrahim", name: "Ibrahim Kedir", submittedAt: "2026-09-28T07:06:00Z" },
      ],
    },
  ];

  const topics = [
    { id: "arrays", name: "Arrays", slug: "arrays", order: 1 },
    { id: "binary-search", name: "Binary Search", slug: "binary-search", order: 2 },
    { id: "dp", name: "Dynamic Programming", slug: "dynamic-programming", order: 3 },
    { id: "graphs", name: "Graphs", slug: "graphs", order: 4 },
    { id: "math", name: "Mathematics", slug: "mathematics", order: 5 },
  ];

  const problems = [
    { id: "p-1", title: "Frog Jumps", topicId: "dp", platform: "codeforces", value: 5, url: "https://codeforces.com/problemset/problem/1324/C", externalRef: { contestId: 1324, index: "C" }, status: "published" },
    { id: "p-2", title: "0/1 Knapsack", topicId: "dp", platform: "codeforces", value: 10, url: "https://codeforces.com/problemset/problem/148/E", externalRef: { contestId: 148, index: "E" }, status: "published" },
    { id: "p-3", title: "LIS Basics", topicId: "dp", platform: "leetcode", value: 8, url: "https://leetcode.com/problems/longest-increasing-subsequence/", externalRef: { titleSlug: "longest-increasing-subsequence" }, status: "published" },
    { id: "p-4", title: "Grid Paths", topicId: "dp", platform: "codeforces", value: 12, url: "https://codeforces.com/problemset/problem/1638/C", externalRef: { contestId: 1638, index: "C" }, status: "published" },
    { id: "p-5", title: "Prefix Sum Range", topicId: "arrays", platform: "codeforces", value: 5, url: "https://codeforces.com/problemset/problem/433/B", externalRef: { contestId: 433, index: "B" }, status: "published" },
    { id: "p-6", title: "Sliding Window Max", topicId: "arrays", platform: "leetcode", value: 8, url: "https://leetcode.com/problems/sliding-window-maximum/", externalRef: { titleSlug: "sliding-window-maximum" }, status: "published" },
    { id: "p-7", title: "First True Predicate", topicId: "binary-search", platform: "codeforces", value: 6, url: "https://codeforces.com/problemset/problem/1201/C", externalRef: { contestId: 1201, index: "C" }, status: "published" },
    { id: "p-8", title: "Search on Answer", topicId: "binary-search", platform: "codeforces", value: 10, url: "https://codeforces.com/problemset/problem/1613/C", externalRef: { contestId: 1613, index: "C" }, status: "published" },
    { id: "p-9", title: "BFS Shortest Path", topicId: "graphs", platform: "codeforces", value: 7, url: "https://codeforces.com/problemset/problem/59/E", externalRef: { contestId: 59, index: "E" }, status: "published" },
    { id: "p-10", title: "Cycle Detection", topicId: "graphs", platform: "leetcode", value: 9, url: "https://leetcode.com/problems/course-schedule/", externalRef: { titleSlug: "course-schedule" }, status: "published" },
    { id: "p-11", title: "Modular Exponent", topicId: "math", platform: "codeforces", value: 6, url: "https://codeforces.com/problemset/problem/630/I", externalRef: { contestId: 630, index: "I" }, status: "published" },
    { id: "p-12", title: "GCD Applications", topicId: "math", platform: "codeforces", value: 5, url: "https://codeforces.com/problemset/problem/1370/A", externalRef: { contestId: 1370, index: "A" }, status: "published" },
  ];

  // Keyed by `${userId}:${problemId}`
  const verifications = {
    "u-ibrahim:p-1": { status: "solved", solvedAt: "2026-09-20T14:22:00Z", lastCheckedAt: "2026-09-20T14:25:00Z" },
    "u-ibrahim:p-3": { status: "pending", solvedAt: null, lastCheckedAt: "2026-10-10T09:00:00Z" },
    "u-ibrahim:p-5": { status: "solved", solvedAt: "2026-09-10T11:00:00Z", lastCheckedAt: "2026-09-10T11:05:00Z" },
    "u-ibrahim:p-6": { status: "solved", solvedAt: "2026-09-14T16:10:00Z", lastCheckedAt: "2026-09-14T16:12:00Z" },
    "u-ibrahim:p-7": { status: "solved", solvedAt: "2026-09-25T13:00:00Z", lastCheckedAt: "2026-09-25T13:02:00Z" },
    "u-ibrahim:p-9": { status: "solved", solvedAt: "2026-10-01T18:40:00Z", lastCheckedAt: "2026-10-01T18:42:00Z" },
    "u-ibrahim:p-11": { status: "solved", solvedAt: "2026-10-04T12:15:00Z", lastCheckedAt: "2026-10-04T12:17:00Z" },
    "u-hana:p-1": { status: "solved", solvedAt: "2026-09-19T10:00:00Z", lastCheckedAt: "2026-09-19T10:05:00Z" },
    "u-hana:p-2": { status: "solved", solvedAt: "2026-09-22T15:30:00Z", lastCheckedAt: "2026-09-22T15:32:00Z" },
    "u-hana:p-5": { status: "solved", solvedAt: "2026-09-09T09:00:00Z", lastCheckedAt: "2026-09-09T09:05:00Z" },
    "u-liya:p-5": { status: "solved", solvedAt: "2026-09-12T10:00:00Z", lastCheckedAt: "2026-09-12T10:05:00Z" },
  };

  const contests = [
    {
      id: "con-1",
      title: "NCC_DSA Weekly Contest #04",
      description: "A weekly NCC_DSA round. Standings are fetched from Codeforces after the contest and then published here.",
      mode: "individual",
      platform: "codeforces",
      platformContestId: "123456",
      url: "https://codeforces.com/contest/123456",
      invitationUrl: "https://codeforces.com/contest/123456",
      startsAt: "2026-12-19T12:30:00Z",
      durationMinutes: 120,
      status: "upcoming",
      publication: "published",
      resultsState: "not_fetched",
      lastFetchedAt: null,
      fetchSummary: null,
    },
    {
      id: "con-2",
      title: "NCC_DSA Weekly Contest #03",
      description: "Weekly individual Codeforces round covering binary search and greedy constructions.",
      mode: "individual",
      platform: "codeforces",
      platformContestId: "123401",
      url: "https://codeforces.com/contest/123401",
      invitationUrl: "https://codeforces.com/contest/123401",
      startsAt: "2026-10-12T12:30:00Z",
      durationMinutes: 120,
      status: "completed",
      publication: "published",
      resultsState: "published",
      lastFetchedAt: "2026-10-12T18:40:00Z",
      fetchSummary: { processed: 42, matched: 37, unmatchedHandles: ["tourist_x", "new_handle_22", "guest_904", "cf_only_1", "cf_only_2"] },
    },
    {
      id: "con-3",
      title: "NCC_DSA Summer Time Tournament",
      description: "End-of-summer Codeforces invitational round.",
      mode: "individual",
      platform: "codeforces",
      platformContestId: "118820",
      url: "https://codeforces.com/contest/118820",
      invitationUrl: "https://codeforces.com/contest/118820",
      startsAt: "2026-08-16T10:00:00Z",
      durationMinutes: 180,
      status: "completed",
      publication: "published",
      resultsState: "published",
      lastFetchedAt: "2026-08-16T15:00:00Z",
      fetchSummary: { processed: 38, matched: 35, unmatchedHandles: ["guest_10", "guest_11", "cf_temp"] },
    },
    {
      id: "con-team-1",
      title: "Team Week #06 — Graphs",
      description: "Week-long Group competition. Standings are fetched from Codeforces after the window ends.",
      mode: "team",
      platform: "codeforces",
      platformContestId: "124100",
      url: "https://codeforces.com/contest/124100",
      invitationUrl: "https://codeforces.com/contest/124100",
      startsAt: "2026-11-14T00:00:00Z",
      durationMinutes: 10080,
      status: "active",
      publication: "published",
      resultsState: "not_fetched",
      lastFetchedAt: null,
      fetchSummary: null,
    },
    {
      id: "con-team-2",
      title: "Team Week #07 — DP",
      description: "Upcoming week-long Group contest focused on dynamic programming.",
      mode: "team",
      platform: "codeforces",
      platformContestId: "124200",
      url: "https://codeforces.com/contest/124200",
      invitationUrl: "https://codeforces.com/contest/124200",
      startsAt: "2026-12-20T00:00:00Z",
      durationMinutes: 10080,
      status: "upcoming",
      publication: "published",
      resultsState: "not_fetched",
      lastFetchedAt: null,
      fetchSummary: null,
    },
    {
      id: "con-team-3",
      title: "Team Week #05 — Binary Search",
      description: "Completed week-long Group contest with derived team rankings.",
      mode: "team",
      platform: "codeforces",
      platformContestId: "124000",
      url: "https://codeforces.com/contest/124000",
      invitationUrl: "https://codeforces.com/contest/124000",
      startsAt: "2026-10-06T00:00:00Z",
      durationMinutes: 10080,
      status: "completed",
      publication: "published",
      resultsState: "published",
      lastFetchedAt: "2026-10-13T07:00:00Z",
      fetchSummary: { processed: 24, matched: 22, unmatchedHandles: ["cf_guest_1", "cf_guest_2"], teamsMatched: 5 },
    },
  ];

  const contestResults = {
    "con-2": [
      { userId: "u-hana", rank: 1, name: "Hana Tesfaye", handle: "hana_t", points: 1280, penalty: 210 },
      { userId: "u-yonas", rank: 2, name: "Yonas Alemu", handle: "yonas_a", points: 1210, penalty: 340 },
      { userId: "u-meron", rank: 3, name: "Meron Bekele", handle: "meron_b", points: 1104, penalty: 510 },
      { userId: "u-dawit", rank: 4, name: "Dawit Haile", handle: "dawit_h", points: 980, penalty: 640 },
      { userId: "u-sara", rank: 5, name: "Sara Mohammed", handle: "sara_m", points: 940, penalty: 700 },
      { userId: "u-ibrahim", rank: 12, name: "Ibrahim Kedir", handle: "ibrahimkediramdela2211", points: 742, penalty: 1240 },
      { userId: "u-liya", rank: 18, name: "Liya Mekonnen", handle: "liya_m", points: 420, penalty: 1580 },
    ],
    "con-3": [
      { userId: "u-hana", rank: 1, name: "Hana Tesfaye", handle: "hana_t", points: 1410, penalty: 190 },
      { userId: "u-ibrahim", rank: 4, name: "Ibrahim Kedir", handle: "ibrahimkediramdela2211", points: 1120, penalty: 430 },
      { userId: "u-yonas", rank: 5, name: "Yonas Alemu", handle: "yonas_a", points: 1090, penalty: 470 },
    ],
    "con-team-3": [
      { userId: "u-ibrahim", teamId: "team-1", rank: 1, name: "Ibrahim Kedir", handle: "ibrahimkediramdela2211", points: 820, penalty: 210 },
      { userId: "u-hana", teamId: "team-1", rank: 2, name: "Hana Tesfaye", handle: "hana_t", points: 790, penalty: 180 },
      { userId: "u-yonas", teamId: "team-1", rank: 3, name: "Yonas Alemu", handle: "yonas_a", points: 720, penalty: 240 },
      { userId: "u-meron", teamId: "team-1", rank: 4, name: "Meron Bekele", handle: "meron_b", points: 510, penalty: 300 },
      { userId: "u-dawit", teamId: "team-2", rank: 5, name: "Dawit Haile", handle: "dawit_h", points: 1410, penalty: 190 },
      { userId: "u-sara", teamId: "team-2", rank: 6, name: "Sara Mohammed", handle: "sara_m", points: 1200, penalty: 240 },
    ],
  };

  const teamContestResults = {
    "con-team-3": [
      { teamId: "team-1", teamName: "Binary Hawks", rank: 1, points: 2840, penalty: 3, memberCount: 4, matchedMembers: 4 },
      { teamId: "team-2", teamName: "Stack Overflowers", rank: 2, points: 2610, penalty: 4, memberCount: 5, matchedMembers: 5 },
      { teamId: "team-3", teamName: "Null Pointers", rank: 3, points: 2405, penalty: 2, memberCount: 4, matchedMembers: 3 },
      { teamId: "team-4", teamName: "Edge Cases", rank: 4, points: 2100, penalty: 5, memberCount: 5, matchedMembers: 4 },
      { teamId: "team-5", teamName: "Recursion Rangers", rank: 5, points: 1980, penalty: 4, memberCount: 5, matchedMembers: 3 },
    ],
  };

  const ratingHistory = {
    "u-ibrahim": [
      { id: "rh-7", label: "Oct 9", computedAt: "2026-10-09T18:00:00Z", previous: 3.95, value: 4.27, change: 0.32, source: "scheduled", components: { problem: 4.5, contest: 4.1, attendance: 4.7 }, formulaVersion: "v1-preview" },
      { id: "rh-6", label: "Oct 2", computedAt: "2026-10-02T18:00:00Z", previous: 4.05, value: 3.95, change: -0.10, source: "scheduled", components: { problem: 4.2, contest: 3.7, attendance: 4.5 }, formulaVersion: "v1-preview" },
      { id: "rh-5", label: "Sep 25", computedAt: "2026-09-25T18:00:00Z", previous: 3.72, value: 4.05, change: 0.33, source: "scheduled", components: { problem: 4.1, contest: 4.0, attendance: 4.4 }, formulaVersion: "v1-preview" },
      { id: "rh-4", label: "Sep 18", computedAt: "2026-09-18T18:00:00Z", previous: 3.90, value: 3.72, change: -0.18, source: "scheduled", components: { problem: 3.8, contest: 3.6, attendance: 4.2 }, formulaVersion: "v1-preview" },
      { id: "rh-3", label: "Sep 15", computedAt: "2026-09-15T18:00:00Z", previous: 3.45, value: 3.90, change: 0.45, source: "scheduled", components: { problem: 3.9, contest: 3.8, attendance: 4.1 }, formulaVersion: "v1-preview" },
      { id: "rh-2", label: "Sep 8", computedAt: "2026-09-08T18:00:00Z", previous: 3.20, value: 3.45, change: 0.25, source: "scheduled", components: { problem: 3.4, contest: 3.3, attendance: 3.8 }, formulaVersion: "v1-preview" },
      { id: "rh-1", label: "Sep 1", computedAt: "2026-09-01T18:00:00Z", previous: null, value: 3.20, change: null, source: "initial", components: { problem: 3.2, contest: 3.2, attendance: 3.2 }, formulaVersion: "v1-preview" },
    ],
    "u-hana": [
      { id: "rh-h1", label: "Oct 9", computedAt: "2026-10-09T18:00:00Z", previous: 4.48, value: 4.62, change: 0.14, source: "scheduled", components: { problem: 4.8, contest: 4.4, attendance: 4.7 }, formulaVersion: "v1-preview" },
    ],
    "u-liya": [
      { id: "rh-l1", label: "Oct 3", computedAt: "2026-10-03T12:00:00Z", previous: 1.92, value: 1.84, change: -0.08, source: "scheduled", components: { problem: 1.6, contest: 1.9, attendance: 2.1 }, formulaVersion: "v1-preview" },
    ],
  };

  const notifications = [
    {
      id: "notif-1",
      userId: "u-ibrahim",
      type: "contest_published",
      title: "Contest published",
      body: "NCC_DSA Weekly Contest #04 is scheduled for Sunday at 3:30 PM.",
      href: "/contests/con-1",
      createdAt: "2026-10-10T14:00:00Z",
    },
    {
      id: "notif-2",
      userId: "u-ibrahim",
      type: "announcement_published",
      title: "Announcement published",
      body: "Summer tournament seating was published.",
      href: "/announcements/ann-1",
      createdAt: "2026-10-11T09:00:00Z",
    },
    {
      id: "notif-3",
      userId: "u-ibrahim",
      type: "attendance_recorded",
      title: "Attendance recorded",
      body: "Attendance recorded for Arrays and Prefix Sums.",
      href: "/attendance",
      createdAt: "2026-10-06T13:12:00Z",
    },
  ];

  const auditLogs = [
    { id: "aud-1", action: "lecture.publish", entityType: "Lecture", entityId: "lec-1", summary: "Published lecture Binary Search Patterns", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-13T09:10:00Z", correlationId: "corr-9081a" },
    { id: "aud-2", action: "results.publish", entityType: "Contest", entityId: "con-team-3", summary: "Published Team Week #05 — Binary Search standings", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-13T07:15:00Z", correlationId: "corr-9074b" },
    { id: "aud-3", action: "results.fetch", entityType: "Contest", entityId: "con-2", summary: "Fetched Codeforces standings for Weekly Contest #03 · 42 participants", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-12T18:40:00Z", correlationId: "corr-8910c" },
    { id: "aud-4", action: "announcement.publish", entityType: "Announcement", entityId: "ann-1", summary: "Published announcement Summer tournament seating", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-11T09:00:00Z", correlationId: "corr-8840d" },
    { id: "aud-5", action: "contest.create", entityType: "Contest", entityId: "con-1", summary: "Created contest NCC_DSA Weekly Contest #04", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-10T13:55:00Z", correlationId: "corr-8722e" },
    { id: "aud-6", action: "problem.create", entityType: "Problem", entityId: "p-4", summary: "Added problem Grid Paths · Dynamic Programming", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-09T11:20:00Z", correlationId: "corr-8651f" },
    { id: "aud-7", action: "attendance.start", entityType: "AttendanceSession", entityId: "att-sess-2", summary: "Started attendance session for Arrays and Prefix Sums", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-06T13:00:00Z", correlationId: "corr-8520g" },
    { id: "aud-8", action: "user.restrict", entityType: "User", entityId: "u-liya", summary: "Restricted account Liya Mekonnen", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-10-03T12:00:00Z", correlationId: "corr-8401h" },
    { id: "aud-9", action: "user.reopen", entityType: "User", entityId: "u-dawit", summary: "Reopened account Dawit Haile", actor: { id: "u-marta", name: "Marta Alemu" }, createdAt: "2026-09-28T15:30:00Z", correlationId: "corr-8312j" },
  ];

  const recentActivity = [
    { id: "act-1", title: "Provisional solve check", detail: "Frog Jumps · Dynamic Programming", date: "Oct 12, 2026" },
    { id: "act-2", title: "Contest result", detail: "Weekly Contest #03 · Rank #12 · 742 points", date: "Oct 12, 2026" },
    { id: "act-3", title: "Attendance", detail: "Arrays and Prefix Sums", date: "Oct 6, 2026" },
    { id: "act-4", title: "Rating change", detail: "3.95 → 4.27", date: "Oct 9, 2026" },
  ];

  return {
    currentUserId: "u-ibrahim",
    pending2faUserId: null,
    admin2faEnabled: false,
    registrationOpen: true,
    restrictedContactEmail: "dsa-heads@ncc.edu",
    users,
    teams,
    announcements,
    lectures,
    attendanceSessions,
    topics,
    problems,
    verifications,
    contests,
    contestResults,
    teamContestResults,
    ratingHistory,
    notifications,
    auditLogs,
    recentActivity,
    heatmapIndividual: buildHeatmapCells(),
    heatmapTeam: buildTeamHeatmapCells(),
  };
}
