import { z } from "zod";

/**
 * Converts a ZodError into the flat `fields` map of the error envelope:
 * dotted field path -> first message for that path. Issues with an empty path use `rootKey`.
 */
export function zodFields(zodError, { rootKey = "_" } = {}) {
  const fields = {};
  for (const issue of zodError.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : rootKey;
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

/** Zod schema for an ObjectId string (24 hex characters), normalized to lower case. */
export function objectId() {
  return z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id")
    .transform((s) => s.toLowerCase());
}
