import { AppError } from "./errors.js";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

function read(source, key) {
  if (source == null) return undefined;
  if (typeof source.get === "function") return source.get(key) ?? undefined;
  return source[key];
}

function parseIntParam(raw, { min, max }) {
  if (typeof raw !== "string" || !/^\d{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

/**
 * Parses `page` (1-based, default 1) and `limit` (default 20, max 50) from URLSearchParams
 * or a plain object. Out-of-range or malformed values are a 400 VALIDATION_ERROR.
 */
export function parsePagination(searchParams) {
  const fields = {};
  const rawPage = read(searchParams, "page");
  const rawLimit = read(searchParams, "limit");

  let page = 1;
  let limit = DEFAULT_LIMIT;
  if (rawPage !== undefined) {
    page = parseIntParam(rawPage, { min: 1, max: 1_000_000 });
    if (page === null) fields.page = "page must be a whole number of at least 1";
  }
  if (rawLimit !== undefined) {
    limit = parseIntParam(rawLimit, { min: 1, max: MAX_LIMIT });
    if (limit === null) fields.limit = `limit must be a whole number from 1 to ${MAX_LIMIT}`;
  }
  if (Object.keys(fields).length) throw new AppError("VALIDATION_ERROR", { fields });
  return { page, limit, skip: (page - 1) * limit };
}

/** List `data` shape of the envelope. */
export function paginated(items, total, { page, limit }) {
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
