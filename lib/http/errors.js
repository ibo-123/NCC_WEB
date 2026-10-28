// Canonical error registry (MASTER_ARCHITECTURE.md §6.4). This is the only list of codes.
// PENDING codes are not approved: AppError refuses to construct them, and no substitute is chosen here.

const approved = (status) => Object.freeze({ status, approved: true });
const pending = (status) => Object.freeze({ status, approved: false });

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: approved(400),
  UNAUTHENTICATED: approved(401),
  FORBIDDEN: approved(403),
  ACCOUNT_RESTRICTED: approved(403),
  NOT_FOUND: approved(404),
  CONFLICT: approved(409),
  INVALID_STATE: approved(409),
  ATTENDANCE_INVALID_CODE: approved(400),
  ATTENDANCE_EXPIRED: approved(409),
  ATTENDANCE_NOT_ACTIVE: approved(409),
  ATTENDANCE_DUPLICATE: approved(409),
  RATE_LIMITED: approved(429),
  INTERNAL_ERROR: approved(500),
  UPSTREAM_ERROR: approved(502),
  DEPENDENCY_UNAVAILABLE: approved(503),
  REGISTRATION_CLOSED: pending(403),
  FEATURE_NOT_CONFIGURED: pending(503),
  INVALID_CREDENTIALS: pending(401),
  TWO_FACTOR_INVALID: pending(401),
  EMAIL_ALREADY_REGISTERED: pending(409),
  CSRF_REJECTED: pending(403),
  UNSUPPORTED_MEDIA_TYPE: pending(415),
});

// Generic default messages. They never describe internals.
const DEFAULT_MESSAGES = Object.freeze({
  VALIDATION_ERROR: "The request is invalid.",
  UNAUTHENTICATED: "Authentication is required.",
  FORBIDDEN: "You do not have permission to do this.",
  ACCOUNT_RESTRICTED: "This account is restricted.",
  NOT_FOUND: "The resource was not found.",
  CONFLICT: "The request conflicts with existing data.",
  INVALID_STATE: "The resource is not in a state that allows this.",
  ATTENDANCE_INVALID_CODE: "The attendance code is not valid.",
  ATTENDANCE_EXPIRED: "The attendance session has expired.",
  ATTENDANCE_NOT_ACTIVE: "There is no open attendance session.",
  ATTENDANCE_DUPLICATE: "Attendance has already been recorded.",
  RATE_LIMITED: "Too many attempts. Try again later.",
  INTERNAL_ERROR: "Something went wrong.",
  UPSTREAM_ERROR: "An external service failed.",
  DEPENDENCY_UNAVAILABLE: "The service is temporarily unavailable.",
});

export class AppError extends Error {
  /**
   * @param {string} code a key of ERROR_CODES that is APPROVED
   * @param {{ message?: string, fields?: Record<string,string>, retryAfterSeconds?: number }} [options]
   */
  constructor(code, { message, fields, retryAfterSeconds } = {}) {
    const entry = Object.hasOwn(ERROR_CODES, code) ? ERROR_CODES[code] : undefined;
    if (!entry) throw new TypeError(`Unknown error code "${String(code)}"`);
    if (!entry.approved) {
      throw new TypeError(`Error code "${code}" is PENDING lead approval and cannot be used`);
    }
    if (retryAfterSeconds !== undefined && !(Number.isInteger(retryAfterSeconds) && retryAfterSeconds > 0)) {
      throw new TypeError("retryAfterSeconds must be a positive integer");
    }
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.status = entry.status;
    if (fields !== undefined) this.fields = fields;
    if (retryAfterSeconds !== undefined) this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Interim configuration refusal (§6.4): HTTP 503 DEPENDENCY_UNAVAILABLE with a generic message.
 * FEATURE_NOT_CONFIGURED is PENDING; when approved, only this function changes.
 * Never include a variable name or value here; log those separately.
 */
export function configRefusal() {
  return new AppError("DEPENDENCY_UNAVAILABLE", { message: "The service is temporarily unavailable." });
}
