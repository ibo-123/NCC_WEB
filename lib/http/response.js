import { AppError, ERROR_CODES } from "./errors.js";

const BASE_HEADERS = { "cache-control": "no-store" };

function build(body, status, extraHeaders) {
  return Response.json(body, { status, headers: { ...BASE_HEADERS, ...extraHeaders } });
}

/** Success envelope: { success: true, data }. */
export function ok(data, { status = 200, headers } = {}) {
  return build({ success: true, data }, status, headers);
}

/**
 * Failure envelope: { success: false, error: { code, message, fields?, retryAfterSeconds? } }.
 * Anything that is not an AppError becomes a generic INTERNAL_ERROR; its message and stack are never exposed.
 */
export function failure(error, { headers } = {}) {
  const appError = error instanceof AppError ? error : new AppError("INTERNAL_ERROR");
  const body = { code: appError.code, message: appError.message };
  if (appError.fields !== undefined) body.fields = appError.fields;
  if (appError.retryAfterSeconds !== undefined) body.retryAfterSeconds = appError.retryAfterSeconds;
  const extra = { ...headers };
  if (appError.retryAfterSeconds !== undefined) extra["retry-after"] = String(appError.retryAfterSeconds);
  return build({ success: false, error: body }, ERROR_CODES[appError.code].status, extra);
}
