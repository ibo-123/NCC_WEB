import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password.js";
import {
  checkIn,
  closeAttendance,
  getAttendanceSession,
  listAttendanceSessions,
  startAttendance,
} from "@/lib/services/attendance.js";
import {
  createLecture,
  deleteLecture,
  publishLecture,
} from "@/lib/services/lectures.js";
import { AttendanceSession } from "@/models/AttendanceSession.js";
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
});

describe("Attendance & Lecture lifecycle services", () => {
  it("encrypts attendance code at rest, supports student check-in, blocks duplicates, and hides code in lists", async () => {
    const now = new Date("2026-10-28T12:00:00Z");
    const admin = await User.create({
      name: "Marta",
      email: "marta@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });
    const student = await User.create({
      name: "Ibrahim",
      email: "ibrahim@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
    });

    const adminCtx = { actor: { id: String(admin._id), role: "admin" }, now, correlationId: "c1" };
    const studentCtx = { actor: { id: String(student._id), role: "student" }, now, correlationId: "c2" };

    const lec = await createLecture(adminCtx, {
      title: "Trees & LCA",
      description: "Binary lifting",
      scheduledAt: "2026-10-28T12:00:00Z",
    });
    await publishLecture(adminCtx, lec.id);

    const started = await startAttendance(adminCtx, lec.id, { validForSeconds: 600 });
    expect(started.code).toMatch(/^\d{4}$/);

    // Stored document has encrypted codeEnc, never plaintext code
    const rawSess = await AttendanceSession.findById(started.id).select("+codeEnc").lean();
    expect(rawSess.codeEnc).toBeTruthy();
    expect(rawSess.codeEnc).not.toContain(started.code);

    // List endpoint omits code; detail returns code while open
    const listed = await listAttendanceSessions(adminCtx, {});
    expect(listed.items[0].code).toBeNull();
    const detail = await getAttendanceSession(adminCtx, started.id);
    expect(detail.session.code).toBe(started.code);

    // Deleting lecture with open attendance session is refused (A2)
    await expect(deleteLecture(adminCtx, lec.id)).rejects.toMatchObject({
      code: "INVALID_STATE",
      status: 409,
    });

    // Wrong code fails with ATTENDANCE_INVALID_CODE
    const badCode = started.code === "0000" ? "1111" : "0000";
    await expect(
      checkIn(studentCtx, lec.id, badCode, { clientIp: "10.0.0.1" }),
    ).rejects.toMatchObject({ code: "ATTENDANCE_INVALID_CODE" });

    // Valid code succeeds
    const checked = await checkIn(studentCtx, lec.id, started.code, { clientIp: "10.0.0.1" });
    expect(checked.record.lectureId).toBe(lec.id);

    // Duplicate check-in throws ATTENDANCE_DUPLICATE
    await expect(
      checkIn(studentCtx, lec.id, started.code, { clientIp: "10.0.0.1" }),
    ).rejects.toMatchObject({ code: "ATTENDANCE_DUPLICATE", status: 409 });

    // Closing attendance wipes code and allows lecture deletion
    await closeAttendance(adminCtx, started.id);
    const closedDetail = await getAttendanceSession(adminCtx, started.id);
    expect(closedDetail.session.code).toBeNull();
    await expect(deleteLecture(adminCtx, lec.id)).resolves.toEqual({ id: lec.id });
  });

  it("lazily closes expired sessions and rejects late check-in with ATTENDANCE_EXPIRED", async () => {
    const t0 = new Date("2026-10-28T13:00:00Z");
    const admin = await User.create({
      name: "Admin",
      email: "admin@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });
    const student = await User.create({
      name: "Student",
      email: "stud@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
    });

    const lec = await createLecture(
      { actor: { id: String(admin._id), role: "admin" }, now: t0, correlationId: "c1" },
      { title: "DP Lecture", description: "", scheduledAt: "2026-10-28T13:00:00Z" },
    );
    await publishLecture({ actor: { id: String(admin._id), role: "admin" }, now: t0, correlationId: "c1" }, lec.id);
    const started = await startAttendance(
      { actor: { id: String(admin._id), role: "admin" }, now: t0, correlationId: "c1" },
      lec.id,
      { validForSeconds: 60 },
    );

    const expiredAt = new Date(t0.getTime() + 61_000);
    await expect(
      checkIn({ actor: { id: String(student._id), role: "student" }, now: expiredAt }, lec.id, started.code, {
        clientIp: "10.0.0.2",
      }),
    ).rejects.toMatchObject({ code: "ATTENDANCE_EXPIRED", status: 409 });

    const persisted = await AttendanceSession.findById(started.id).select("+codeEnc").lean();
    expect(persisted.closedAt).not.toBeNull();
    expect(persisted.codeEnc).toBeNull();
  });

  it("locks out a student after repeated wrong attendance codes", async () => {
    const t0 = new Date("2026-10-28T14:00:00Z");
    const admin = await User.create({
      name: "Admin",
      email: "admin2@ncc.edu",
      passwordHash: await hashPassword("adminpass123"),
      role: "admin",
      status: "active",
    });
    const student = await User.create({
      name: "Brute",
      email: "brute@ncc.edu",
      passwordHash: await hashPassword("studentpass123"),
      role: "student",
      status: "active",
    });

    const adminCtx = { actor: { id: String(admin._id), role: "admin" }, now: t0, correlationId: "c3" };
    const lec = await createLecture(adminCtx, {
      title: "Graphs",
      description: "",
      scheduledAt: "2026-10-28T14:00:00Z",
    });
    await publishLecture(adminCtx, lec.id);
    const started = await startAttendance(adminCtx, lec.id, { validForSeconds: 600 });
    const wrong = started.code === "9999" ? "8888" : "9999";

    const sCtx = { actor: { id: String(student._id), role: "student" }, now: t0 };
    for (let i = 0; i < 4; i += 1) {
      await expect(checkIn(sCtx, lec.id, wrong, { clientIp: "10.0.0.3" })).rejects.toMatchObject({
        code: "ATTENDANCE_INVALID_CODE",
      });
    }
    await expect(checkIn(sCtx, lec.id, wrong, { clientIp: "10.0.0.3" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });
  });
});
