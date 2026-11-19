import * as OTPAuth from "otpauth";

const TOTP_OPTIONS = Object.freeze({
  issuer: "NCC_DSA",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
});

export function generateTotpSecret({ email }) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    ...TOTP_OPTIONS,
    label: String(email),
    secret,
  });
  return {
    secretBase32: secret.base32,
    otpauthUri: totp.toString(),
  };
}

/**
 * Validates a 6-digit TOTP code with ±1 window tolerance and replay prevention.
 */
export function verifyTotpCode({
  secretBase32,
  code,
  now = new Date(),
  lastUsedStep = null,
}) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return { valid: false, reason: "invalid" };
  }
  const secret = OTPAuth.Secret.fromBase32(secretBase32);
  const totp = new OTPAuth.TOTP({
    ...TOTP_OPTIONS,
    secret,
  });
  const ts = now instanceof Date ? now.getTime() : Number(now);
  const delta = totp.validate({ token: code, window: 1, timestamp: ts });
  if (delta === null) {
    return { valid: false, reason: "invalid" };
  }
  const currentStep = Math.floor(ts / (TOTP_OPTIONS.period * 1000));
  const matchedStep = currentStep + delta;
  if (lastUsedStep !== null && lastUsedStep !== undefined && matchedStep <= lastUsedStep) {
    return { valid: false, reason: "replay" };
  }
  return { valid: true, matchedStep };
}
