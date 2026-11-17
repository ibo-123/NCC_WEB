import { describe, expect, it } from "vitest";
import { between, codeTokens, PERMISSION, readDoc, tableRows } from "./helpers/markdown.js";

// Guards the frozen contracts against drift inside the documentation itself.
// These tests read the documents only. Code-level conformance (lib/http registry,
// lib/auth permission map, app/api route files) is added when that code exists.

const master = readDoc("docs/MASTER_ARCHITECTURE.md");
const api = readDoc("docs/API_CONTRACT.md");
const auth = readDoc("docs/AUTH_AND_SECURITY.md");

const registry = tableRows(between(master, "### 6.4", "### 6.5"))
  .filter((cells) => /^`[A-Z_]+`$/.test(cells[0]))
  .map((cells) => ({ code: cells[0].replace(/`/g, ""), http: cells[1], status: cells[3] }));

const catalog = new Set(
  tableRows(between(master, "### 7.3", "### 7.4"))
    .slice(1)
    .flatMap((cells) => codeTokens(cells[0]))
    .filter((token) => PERMISSION.test(token)),
);

function routeAccess(sectionText, accessColumn) {
  return tableRows(sectionText)
    .filter((cells) => cells[0].includes("/api/"))
    .map((cells) => {
      const cell = cells[accessColumn];
      if (/^public\b/.test(cell)) return { route: cells[0], access: ["public"] };
      return { route: cells[0], access: codeTokens(cell).filter((token) => PERMISSION.test(token)) };
    });
}

const apiRoutes = routeAccess(between(api, "## 3.", "## 6."), 1);
const authRoutes = routeAccess(between(auth, "Auth routes in v1", "## 6."), 1);

describe("error registry (MASTER_ARCHITECTURE section 6.4)", () => {
  it("has 15 approved and exactly 7 pending codes", () => {
    const pending = registry.filter((row) => row.status.includes("PENDING")).map((row) => row.code);
    expect(registry).toHaveLength(22);
    expect(registry.filter((row) => row.status.includes("APPROVED"))).toHaveLength(15);
    expect(pending.sort()).toEqual(
      [
        "CSRF_REJECTED",
        "EMAIL_ALREADY_REGISTERED",
        "FEATURE_NOT_CONFIGURED",
        "INVALID_CREDENTIALS",
        "REGISTRATION_CLOSED",
        "TWO_FACTOR_INVALID",
        "UNSUPPORTED_MEDIA_TYPE",
      ].sort(),
    );
  });

  it("never uses 422", () => {
    expect(registry.some((row) => row.http === "422")).toBe(false);
  });
});

describe("permission catalog (MASTER_ARCHITECTURE section 7.3)", () => {
  it("lists 44 permissions", () => {
    expect(catalog.size).toBe(44);
  });
});

describe("API_CONTRACT routes", () => {
  it("gives every route exactly one catalogued permission or a public declaration", () => {
    expect(apiRoutes.length).toBeGreaterThan(50);
    for (const { route, access } of apiRoutes) {
      expect(access, route).toHaveLength(1);
      if (access[0] !== "public") expect(catalog.has(access[0]), `${route} -> ${access[0]}`).toBe(true);
    }
  });

  it("uses every catalogued permission at least once", () => {
    const used = new Set(apiRoutes.flatMap(({ access }) => access));
    expect([...catalog].filter((permission) => !used.has(permission))).toEqual([]);
  });

  it("declares exactly register and login as public", () => {
    const publicRoutes = apiRoutes.filter(({ access }) => access[0] === "public").map(({ route }) => route);
    expect(publicRoutes.sort()).toEqual(["POST `/api/auth/login`", "POST `/api/auth/register`"].sort());
  });

  it("does not put a pending error code in a route row", () => {
    const pending = registry.filter((row) => row.status.includes("PENDING")).map((row) => row.code);
    const rows = tableRows(between(api, "## 3.", "## 6.")).filter((cells) => cells[0].includes("/api/"));
    for (const cells of rows) {
      for (const code of pending) expect(cells.join(" | "), cells[0]).not.toContain(code);
    }
  });
});

describe("AUTH_AND_SECURITY routes", () => {
  it("uses only catalogued permissions or public", () => {
    expect(authRoutes.length).toBeGreaterThanOrEqual(6);
    for (const { route, access } of authRoutes) {
      expect(access, route).toHaveLength(1);
      if (access[0] !== "public") expect(catalog.has(access[0]), `${route} -> ${access[0]}`).toBe(true);
    }
  });
});
