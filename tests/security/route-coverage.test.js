import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_CATALOG_PERMISSIONS, PUBLIC_ROUTES } from "@/lib/auth/permissions.js";

function walkRoutes(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkRoutes(full));
    } else if (entry.name === "route.js") {
      results.push(full);
    }
  }
  return results;
}

describe("API route wrapper and permission coverage", () => {
  const apiRoot = path.resolve(process.cwd(), "app/api");
  const routeFiles = walkRoutes(apiRoot).sort();

  it("finds all 54 API route files", () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(54);
  });

  it("wraps every exported HTTP method in withApi with a valid catalog permission or documented public route", () => {
    const publicPaths = new Set(PUBLIC_ROUTES.map((r) => `${r.method} ${r.path}`));
    const usedPermissions = new Set();

    for (const filePath of routeFiles) {
      const rel = path.relative(apiRoot, filePath).replace(/\\/g, "/");
      const apiPath = `/api/${rel.replace(/\/route\.js$/, "")}`;
      const src = fs.readFileSync(filePath, "utf8");

      const methodMatches = [...src.matchAll(/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*withApi\s*\(\s*\{([\s\S]*?)\}\s*,/g)];
      expect(methodMatches.length, `Expected withApi-wrapped HTTP exports in ${rel}`).toBeGreaterThan(0);

      for (const m of methodMatches) {
        const method = m[1];
        const decl = m[2];
        const permMatch = decl.match(/permission:\s*["']([^"']+)["']/);
        const pubMatch = decl.match(/public:\s*\{/);

        expect(
          Boolean(permMatch) !== Boolean(pubMatch),
          `${method} ${apiPath} must declare exactly one of permission or public`,
        ).toBe(true);

        if (permMatch) {
          const perm = permMatch[1];
          expect(ALL_CATALOG_PERMISSIONS, `Unknown permission ${perm} in ${rel}`).toContain(perm);
          usedPermissions.add(perm);
        } else {
          expect(
            publicPaths.has(`${method} ${apiPath}`),
            `Unexpected public route ${method} ${apiPath}`,
          ).toBe(true);
        }
      }
    }

    // rating.recalculate is intentionally unreleased pending formula B1 (API_CONTRACT.md)
    const unreleased = new Set(["rating.recalculate"]);
    for (const perm of ALL_CATALOG_PERMISSIONS) {
      if (unreleased.has(perm)) continue;
      expect(usedPermissions.has(perm), `Unused permission in catalog: ${perm}`).toBe(true);
    }
  });
});
