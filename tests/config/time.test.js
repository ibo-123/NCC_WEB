import { describe, expect, it } from "vitest";
import { campusDay } from "@/lib/config/time.js";

// Africa/Addis_Ababa is UTC+3 all year (no DST).
describe("campusDay", () => {
  it("returns YYYY-MM-DD in the default campus timezone", () => {
    expect(campusDay(new Date("2026-10-28T10:00:00Z"))).toBe("2026-10-28");
  });

  it("rolls to the next day at 21:00 UTC (00:00 campus time)", () => {
    expect(campusDay(new Date("2026-10-27T20:59:59.999Z"))).toBe("2026-10-27");
    expect(campusDay(new Date("2026-10-27T21:00:00.000Z"))).toBe("2026-10-28");
  });

  it("crosses month and year boundaries", () => {
    expect(campusDay(new Date("2026-12-31T21:30:00Z"))).toBe("2027-01-01");
    expect(campusDay(new Date("2026-02-28T22:00:00Z"))).toBe("2026-03-01");
    expect(campusDay(new Date("2028-02-28T21:00:00Z"))).toBe("2028-02-29");
  });

  it("differs from the UTC date late in the UTC day", () => {
    const instant = new Date("2026-06-15T23:30:00Z");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-06-15");
    expect(campusDay(instant)).toBe("2026-06-16");
  });

  it("honors an explicit timezone, including one behind UTC", () => {
    const instant = new Date("2026-10-28T02:00:00Z");
    expect(campusDay(instant, { timeZone: "UTC" })).toBe("2026-10-28");
    expect(campusDay(instant, { timeZone: "America/New_York" })).toBe("2026-10-27");
  });

  it("accepts timestamps and ISO strings", () => {
    expect(campusDay("2026-10-27T21:00:00Z")).toBe("2026-10-28");
    expect(campusDay(Date.parse("2026-10-27T20:00:00Z"))).toBe("2026-10-27");
  });

  it("rejects invalid dates", () => {
    expect(() => campusDay(new Date("nope"))).toThrow(TypeError);
  });
});
