import { describe, expect, it } from "vitest";
import {
  ALL_CATALOG_PERMISSIONS,
  PUBLIC_ROUTES,
  ROLE_PERMISSIONS,
  can,
  isPublicRoute,
} from "@/lib/auth/permissions.js";

describe("RBAC permissions matrix", () => {
  it("grants student permissions only to students (except shared session routes)", () => {
    expect(can("student", "attendance.checkin")).toBe(true);
    expect(can("student", "teams.manage")).toBe(true);
    expect(can("student", "problems.check")).toBe(true);
    expect(can("student", "users.restrict")).toBe(false);
    expect(can("student", "attendance.manage")).toBe(false);
  });

  it("grants admin operational and security permissions without student-only routes", () => {
    expect(can("admin", "auth.2fa.verify")).toBe(true);
    expect(can("admin", "twofa.enroll")).toBe(true);
    expect(can("admin", "results.fetch")).toBe(true);
    expect(can("admin", "attendance.checkin")).toBe(false);
    expect(can(null, "auth.me")).toBe(false);
    expect(can("superuser", "auth.me")).toBe(false);
  });

  it("includes auth.me and auth.logout for both roles", () => {
    for (const role of ["student", "admin"]) {
      expect(ROLE_PERMISSIONS[role]).toContain("auth.me");
      expect(ROLE_PERMISSIONS[role]).toContain("auth.logout");
    }
    expect(ALL_CATALOG_PERMISSIONS.length).toBeGreaterThanOrEqual(44);
  });

  it("exposes strictly scoped PUBLIC_ROUTES", () => {
    expect(PUBLIC_ROUTES.map((r) => `${r.method} ${r.path}`)).toEqual([
      "POST /api/auth/register",
      "POST /api/auth/login",
    ]);
    expect(isPublicRoute("POST", "/api/auth/login")).toBe(true);
    expect(isPublicRoute("GET", "/api/auth/me")).toBe(false);
  });
});
