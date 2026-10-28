import { getCampusTimezone } from "./env.js";

/**
 * Campus calendar day for an instant, as "YYYY-MM-DD" in CAMPUS_TIMEZONE
 * (PROPOSED default Africa/Addis_Ababa). `options.timeZone` overrides the configured zone (tests).
 */
export function campusDay(date, options = {}) {
  const instant = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instant.getTime())) throw new TypeError("campusDay requires a valid date");
  const timeZone = options.timeZone ?? getCampusTimezone();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
