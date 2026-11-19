import bcrypt from "bcryptjs";
import { assertConfigReady } from "@/lib/config/env.js";

export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;

// Valid bcrypt hash used to equalize work when login receives an unknown email.
export const DUMMY_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8uP2rH6cU/n8b8k7rM1n2p8X5x8d6O";

export function validatePasswordBytes(password) {
  if (typeof password !== "string") return "Password is required.";
  const byteLen = Buffer.byteLength(password, "utf8");
  if (byteLen < PASSWORD_MIN_BYTES) {
    return `Password must be at least ${PASSWORD_MIN_BYTES} bytes.`;
  }
  if (byteLen > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes.`;
  }
  return null;
}

export async function hashPassword(password) {
  const { bcryptCost } = assertConfigReady("core");
  return bcrypt.hash(String(password), bcryptCost);
}

export async function verifyPassword(password, hash) {
  const target = typeof hash === "string" && hash.length > 0 ? hash : DUMMY_PASSWORD_HASH;
  return bcrypt.compare(String(password ?? ""), target);
}
