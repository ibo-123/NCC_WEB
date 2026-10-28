import { describe, expect, it } from "vitest";
import { z } from "zod";
import { objectId, zodFields } from "@/lib/validation/index.js";

describe("zodFields", () => {
  it("flattens nested paths to dotted keys, first message wins", () => {
    const schema = z.object({
      email: z.string().email("Bad email").min(30, "Too short"),
      profile: z.object({ handle: z.string().min(3, "Handle too short") }),
      tags: z.array(z.string().min(2, "Tag too short")),
    });
    const result = schema.safeParse({ email: "x", profile: { handle: "a" }, tags: ["ok", "b"] });
    expect(zodFields(result.error)).toEqual({
      email: "Bad email",
      "profile.handle": "Handle too short",
      "tags.1": "Tag too short",
    });
  });

  it("uses a root key for issues without a path", () => {
    const result = z.string().safeParse(5);
    expect(Object.keys(zodFields(result.error))).toEqual(["_"]);
    expect(Object.keys(zodFields(result.error, { rootKey: "body" }))).toEqual(["body"]);
  });

  it("does not echo input values", () => {
    const result = z.object({ password: z.string().min(12) }).safeParse({ password: "hunter2" });
    expect(JSON.stringify(zodFields(result.error))).not.toContain("hunter2");
  });
});

describe("objectId", () => {
  const schema = objectId();
  it("accepts 24 hex characters and lower-cases them", () => {
    expect(schema.parse("507F1F77BCF86CD799439011")).toBe("507f1f77bcf86cd799439011");
  });
  it.each(["", "123", "507f1f77bcf86cd79943901", "507f1f77bcf86cd7994390111", "zzzzzzzzzzzzzzzzzzzzzzzz", 5, null])(
    "rejects %j",
    (value) => {
      expect(schema.safeParse(value).success).toBe(false);
    },
  );
});
