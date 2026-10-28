// TEMPORARY stub for the five response contracts BLOCKED by DECISIONS.md §4.1 LA-3.
// It is not the contract. A failure envelope needs an approved `error.code`; none exists for
// these cases yet, so no code is invented or reused. Replace this module only after A1 records LA-3.

// Intended refusal behavior, kept so the decision can be made. Not a response contract.
export const BLOCKED_KINDS = Object.freeze({
  "registration-closed": Object.freeze({ intendedStatus: 403, pendingCode: "REGISTRATION_CLOSED" }),
  "login-failure": Object.freeze({ intendedStatus: 401, pendingCode: "INVALID_CREDENTIALS" }),
  "two-factor-invalid": Object.freeze({ intendedStatus: 401, pendingCode: "TWO_FACTOR_INVALID" }),
  csrf: Object.freeze({ intendedStatus: 403, pendingCode: "CSRF_REJECTED" }),
  "non-json": Object.freeze({ intendedStatus: 415, pendingCode: "UNSUPPORTED_MEDIA_TYPE" }),
});

export class BlockedContractError extends Error {
  constructor(kind) {
    super(`Response contract "${kind}" is BLOCKED (LA-3)`);
    this.name = "BlockedContractError";
    this.kind = kind;
  }
}

/** Throws BlockedContractError. `withApi` logs LA-3-BLOCKED and answers INTERNAL_ERROR. */
export function refuseBlocked(kind) {
  if (!Object.hasOwn(BLOCKED_KINDS, kind)) throw new TypeError(`Unknown blocked kind "${String(kind)}"`);
  throw new BlockedContractError(kind);
}
