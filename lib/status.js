/**
 * Maps domain status labels (aligned with DATABASE_SCHEMA.md §3 and design-reference)
 * to approved Badge tones in components/ui/Badge.js.
 */
export function statusToTone(status) {
  const normalized = String(status ?? "").trim().toLowerCase();
  const map = {
    published: "success",
    solved: "success",
    active: "info",
    "active account": "success",
    attended: "success",
    present: "success",
    matched: "success",
    ok: "success",
    upcoming: "warning",
    "starting soon": "warning",
    pending: "warning",
    "verification pending": "warning",
    important: "warning",
    warning: "warning",
    open: "info",
    info: "info",
    contest: "info",
    lecture: "info",
    attendance: "info",
    team: "info",
    individual: "neutral",
    general: "neutral",
    draft: "draft",
    "not open": "draft",
    completed: "completed",
    closed: "completed",
    unsolved: "unsolved",
    "not solved": "unsolved",
    "not submitted": "unsolved",
    "not recorded": "unsolved",
    failed: "danger",
    "verification failed": "danger",
    restricted: "danger",
    disbanded: "danger",
    missed: "danger",
    live: "danger",
    unavailable: "neutral",
  };
  return map[normalized] ?? "neutral";
}

export function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
