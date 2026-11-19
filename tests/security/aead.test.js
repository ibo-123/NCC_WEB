import { afterEach, describe, expect, it, vi } from "vitest";
import { AEAD_PURPOSES, decrypt, encrypt } from "@/lib/security/aead.js";
import { applyTestEnv, randomKey32 } from "../helpers/mongoTestEnv.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AEAD encryption", () => {
  it("encrypts and decrypts round-trip when purpose and ownerId match", () => {
    applyTestEnv();
    const cipher = encrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-123", "4837");
    expect(cipher.startsWith("v1.")).toBe(true);
    expect(cipher).not.toContain("4837");
    expect(decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-123", cipher)).toBe("4837");
  });

  it("supports ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS rotation on decrypt", () => {
    const oldKey = randomKey32();
    const newKey = randomKey32();
    applyTestEnv({
      ATTENDANCE_CODE_ENCRYPTION_KEY: oldKey,
      ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS: undefined,
    });
    const legacyCipher = encrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-rot", "9102");

    applyTestEnv({
      ATTENDANCE_CODE_ENCRYPTION_KEY: newKey,
      ATTENDANCE_CODE_ENCRYPTION_KEY_PREVIOUS: oldKey,
    });
    expect(decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-rot", legacyCipher)).toBe("9102");

    const freshCipher = encrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-rot", "3344");
    expect(freshCipher.split(".")[1]).not.toBe(legacyCipher.split(".")[1]);
    expect(decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-rot", freshCipher)).toBe("3344");
  });

  it("fails safe with INTERNAL_ERROR on ownerId mismatch, cross-purpose misuse, or tampering", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    applyTestEnv();
    const cipher = encrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-a", "5566");

    expect(() => decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-b", cipher)).toThrowError(
      expect.objectContaining({ code: "INTERNAL_ERROR" }),
    );
    expect(() => decrypt(AEAD_PURPOSES.ADMIN_2FA_SECRET, "sess-a", cipher)).toThrowError(
      expect.objectContaining({ code: "INTERNAL_ERROR" }),
    );

    const parts = cipher.split(".");
    parts[4] = `${parts[4].slice(0, -2)}AA`;
    expect(() => decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-a", parts.join("."))).toThrowError(
      expect.objectContaining({ code: "INTERNAL_ERROR" }),
    );
    expect(() => decrypt(AEAD_PURPOSES.ATTENDANCE_CODE, "sess-a", null)).toThrowError(
      expect.objectContaining({ code: "INTERNAL_ERROR" }),
    );
  });
});
