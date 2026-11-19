import * as OTPAuth from "otpauth";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetConfigCache } from "@/lib/config/env.js";
import { hashPassword } from "@/lib/auth/password.js";
import { resolveAccess, SESSION_COOKIE_NAME } from "@/lib/auth/session.js";
import {
  confirmTwoFactorEnrollment,
  loginUser,
  registerUser,
  startTwoFactorEnrollment,
  verifyTwoFactor,
} from "@/lib/services/auth.js";
import { reopenUser, restrictUser } from "@/lib/services/users.js";
import { AuditLog } from "@/models/AuditLog.js";
import { Session } from "@/models/Session.js";
import { User } from "@/models/User.js";
import { startTestMongo } from "../helpers/mongoTestEnv.js";

let mongo;

beforeAll(async () => {
  mongo = await startTestMongo();
}, 30000);

afterAll(async () => {
  await mongo?.stop();
});

beforeEach(async () => {
  await mongo.clear();
  process.env.REGISTRATION_MODE = "open";
  resetConfigCache();
});

function reqWithCookie(rawToken) {
  return new Request("http://localhost:3000/api/dashboard", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}` },
  });
}

describe("Auth, 2FA, session access, and user restriction services", () => {
  it("registers students when open, rejects duplicates with 409, and refuses registration when closed", async () => {
    const now = new Date("2026-10-28T09:00:00Z");
    const reg = await registerUser(
      { now },
      {
        name: "Abel Tadesse",
        email: "abel@ncc.edu",
        password: "strongpassword1",
        confirmPassword: "strongpassword1",
        clientIp: "10.0.0.5",
      },
    );
    expect(reg.user.email).toBe("abel@ncc.edu");
    expect(reg.user.role).toBe("student");
    expect(reg.user.status).toBe("active");

    await expect(
      registerUser(
        { now },
        {
          name: "Abel Two",
          email: "ABEL@ncc.edu",
          password: "strongpassword1",
          confirmPassword: "strongpassword1",
          clientIp: "10.0.0.5",
        },
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });

    process.env.REGISTRATION_MODE = "closed";
    resetConfigCache();
    await expect(
      registerUser(
        { now },
        {
          name: "Another User",
          email: "other@ncc.edu",
          password: "strongpassword1",
          confirmPassword: "strongpassword1",
          clientIp: "10.0.0.6",
        },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("enforces login lockout after repeated bad passwords and clears on valid login", async () => {
    const now = new Date("2026-10-28T09:30:00Z");
    await registerUser(
      { now },
      {
        name: "Biniyam",
        email: "bini@ncc.edu",
        password: "studentpass123",
        confirmPassword: "studentpass123",
        clientIp: "10.0.0.7",
      },
    );

    for (let i = 0; i < 4; i += 1) {
      await expect(
        loginUser({ now }, { email: "bini@ncc.edu", password: "wrong", clientIp: "10.0.0.7" }),
      ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    }

    await expect(
      loginUser({ now }, { email: "bini@ncc.edu", password: "wrong", clientIp: "10.0.0.7" }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });

    // Even valid credentials must wait until lockout expires
    await expect(
      loginUser({ now }, { email: "bini@ncc.edu", password: "studentpass123", clientIp: "10.0.0.7" }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });

    // After 901s lockout ends, valid login succeeds
    const later = new Date(now.getTime() + 901_000);
    const okLogin = await loginUser(
      { now: later },
      { email: "bini@ncc.edu", password: "studentpass123", clientIp: "10.0.0.7" },
    );
    expect(okLogin.rawToken).toBeTruthy();
    expect(okLogin.requiresTwoFactor).toBe(false);
  });

  it("enrolls admin 2FA, requires 2FA on subsequent logins, blocks unverified access, and blocks TOTP replay", async () => {
    const now = new Date("2026-10-28T10:00:00Z");
    const admin = await User.create({
      name: "Marta Admin",
      email: "marta@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });

    const firstLogin = await loginUser(
      { now },
      { email: "marta@ncc.edu", password: "adminpass123", clientIp: "10.0.0.8" },
    );
    expect(firstLogin.requiresTwoFactor).toBe(false);

    const firstSessionAccess = await resolveAccess(
      reqWithCookie(firstLogin.rawToken),
      { permission: "twofa.enroll" },
      { now },
    );

    const enrollment = await startTwoFactorEnrollment(
      { actor: { id: String(admin._id), role: "admin" }, session: firstSessionAccess.session, now },
      { password: "adminpass123" },
    );
    expect(enrollment.secret).toBeTruthy();
    expect(enrollment.otpauthUri).toContain("otpauth://totp/");

    const reloadedSess = await Session.findById(firstSessionAccess.session._id).lean();
    const totp = new OTPAuth.TOTP({
      issuer: "NCC_DSA",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(enrollment.secret),
    });
    const code1 = totp.generate({ timestamp: now.getTime() });

    const confirmRes = await confirmTwoFactorEnrollment(
      {
        actor: { id: String(admin._id), role: "admin" },
        session: reloadedSess,
        now,
        correlationId: "corr-2fa-enroll",
      },
      { code: code1 },
    );
    expect(confirmRes.enabled).toBe(true);

    // Next login requires two-factor verification
    const step2Time = new Date(now.getTime() + 31_000);
    const pendingLogin = await loginUser(
      { now: step2Time },
      { email: "marta@ncc.edu", password: "adminpass123", clientIp: "10.0.0.8" },
    );
    expect(pendingLogin.requiresTwoFactor).toBe(true);

    // Pending 2FA session cannot access admin routes
    await expect(
      resolveAccess(reqWithCookie(pendingLogin.rawToken), { permission: "admin.dashboard.read" }, { now: step2Time }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    // Replaying code1 must fail
    const pendingAccess = await resolveAccess(
      reqWithCookie(pendingLogin.rawToken),
      { permission: "auth.2fa.verify" },
      { now: step2Time },
    );
    await expect(
      verifyTwoFactor(
        { actor: { id: String(admin._id), role: "admin" }, session: pendingAccess.session, now: step2Time },
        { code: code1 },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    // Fresh TOTP code succeeds and grants verified admin session
    const code2 = totp.generate({ timestamp: step2Time.getTime() });
    const verified = await verifyTwoFactor(
      { actor: { id: String(admin._id), role: "admin" }, session: pendingAccess.session, now: step2Time },
      { code: code2 },
    );
    expect(verified.rawToken).not.toBe(pendingLogin.rawToken);

    const adminAccess = await resolveAccess(
      reqWithCookie(verified.rawToken),
      { permission: "admin.dashboard.read" },
      { now: step2Time },
    );
    expect(String(adminAccess.user._id)).toBe(String(admin._id));
  });

  it("restricts and reopens student accounts with audit log entries and access gating", async () => {
    const now = new Date("2026-10-28T11:00:00Z");
    const admin = await User.create({
      name: "Admin",
      email: "admin@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });
    const student = await User.create({
      name: "Liya",
      email: "liya@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
    });

    const studentLogin = await loginUser(
      { now },
      { email: "liya@ncc.edu", password: "studentpass123", clientIp: "10.0.0.9" },
    );

    const restricted = await restrictUser(
      { actor: { id: String(admin._id), role: "admin" }, now, correlationId: "corr-restrict" },
      String(student._id),
      { reason: "Manual policy review" },
    );
    expect(restricted.status).toBe("restricted");

    // Restricted student can read auth.me, but dashboard.read throws ACCOUNT_RESTRICTED
    await expect(
      resolveAccess(reqWithCookie(studentLogin.rawToken), { permission: "auth.me" }, { now }),
    ).resolves.toBeTruthy();
    await expect(
      resolveAccess(reqWithCookie(studentLogin.rawToken), { permission: "dashboard.read" }, { now }),
    ).rejects.toMatchObject({ code: "ACCOUNT_RESTRICTED", status: 403 });

    const reopened = await reopenUser(
      { actor: { id: String(admin._id), role: "admin" }, now, correlationId: "corr-reopen" },
      String(student._id),
    );
    expect(reopened.status).toBe("active");

    await expect(
      resolveAccess(reqWithCookie(studentLogin.rawToken), { permission: "dashboard.read" }, { now }),
    ).resolves.toBeTruthy();

    const logs = await AuditLog.find({}).sort({ createdAt: 1 }).lean();
    expect(logs.map((l) => l.action)).toEqual(["user.restrict", "user.reopen"]);
  });
});
