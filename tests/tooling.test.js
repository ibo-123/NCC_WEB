import { describe, expect, it } from "vitest";
import pkg from "@/package.json";

// Guards the approved tooling baseline (Node range, exact pins, advisory override).
describe("tooling baseline", () => {
  it("declares the approved Node range", () => {
    expect(pkg.engines.node).toBe("^22.12.0 || ^24.0.0");
  });

  it("pins every dependency to an exact version", () => {
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, version] of Object.entries(all)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("overrides the vulnerable nested postcss", () => {
    expect(pkg.overrides.postcss).toBe("8.5.30");
  });

  it("does not include the deferred qrcode dependency", () => {
    expect(pkg.dependencies.qrcode).toBeUndefined();
  });
});
