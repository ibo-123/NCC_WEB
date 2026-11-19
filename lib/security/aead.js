import crypto from "node:crypto";
import { assertConfigReady } from "@/lib/config/env.js";
import { AppError } from "@/lib/http/errors.js";

export const AEAD_PURPOSES = Object.freeze({
  ATTENDANCE_CODE: "attendance-code",
  ADMIN_2FA_SECRET: "admin-2fa-secret",
});

const PREFIX = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function resolveKeysForPurpose(purpose, forEncrypt) {
  if (purpose === AEAD_PURPOSES.ATTENDANCE_CODE) {
    const att = assertConfigReady("attendance");
    if (forEncrypt) return [att.currentKey];
    return [att.currentKey, att.previousKey].filter(Boolean);
  }
  if (purpose === AEAD_PURPOSES.ADMIN_2FA_SECRET) {
    const twofa = assertConfigReady("admin2fa");
    if (!twofa.enabled || !twofa.key) {
      throw new AppError("DEPENDENCY_UNAVAILABLE", {
        message: "Two-factor authentication is unavailable.",
      });
    }
    return [twofa.key];
  }
  throw new TypeError(`Unknown AEAD purpose "${String(purpose)}"`);
}

function buildAad(purpose, ownerId) {
  const normalizedOwner = String(ownerId ?? "").trim();
  if (!normalizedOwner) {
    throw new TypeError("AEAD ownerId must be a non-empty identifier");
  }
  return Buffer.from(`${purpose}:${normalizedOwner}`, "utf8");
}

/**
 * Encrypts plaintext with AES-256-GCM bound to (purpose, ownerId).
 * Format: v1.<keyId>.<iv>.<tag>.<ciphertext> (base64url)
 */
export function encrypt(purpose, ownerId, plaintext) {
  const [keyEntry] = resolveKeysForPurpose(purpose, true);
  const iv = crypto.randomBytes(IV_BYTES);
  const aad = buildAad(purpose, ownerId);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyEntry.bytes, iv);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    keyEntry.keyId,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

/**
 * Decrypts AES-256-GCM ciphertext strictly verifying purpose, ownerId, keyId, and tag.
 * Fails safe with AppError("INTERNAL_ERROR") without leaking secrets or plaintext.
 */
export function decrypt(purpose, ownerId, storedValue) {
  const keys = resolveKeysForPurpose(purpose, false);
  const aad = buildAad(purpose, ownerId);

  try {
    if (typeof storedValue !== "string") {
      throw new Error("Missing ciphertext");
    }
    const parts = storedValue.split(".");
    if (parts.length !== 5 || parts[0] !== PREFIX) {
      throw new Error("Malformed envelope");
    }
    const [, keyId, ivB64, tagB64, dataB64] = parts;
    if (!/^[0-9a-f]{8}$/.test(keyId)) {
      throw new Error("Invalid keyId");
    }
    const keyEntry = keys.find((k) => k.keyId === keyId);
    if (!keyEntry) {
      throw new Error("Key unavailable for purpose");
    }
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error("Invalid IV or tag length");
    }
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyEntry.bytes, iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    console.error(JSON.stringify({ level: "error", event: "aead.decrypt_failed", purpose }));
    throw new AppError("INTERNAL_ERROR");
  }
}
