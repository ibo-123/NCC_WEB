import { z } from "zod";
import { objectId } from "./index.js";

export const idParamSchema = z.object({ id: objectId() });
export const userIdParamSchema = z.object({ userId: objectId() });
export const sessionIdParamSchema = z.object({ sessionId: objectId() });

export const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const registerBodySchema = z.object({
  name: z.string().trim().min(1, "Full name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Password is required."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Password is required."),
});

export const handlesBodySchema = z.object({
  codeforces: z.string().trim().max(64).nullable().optional(),
  leetcode: z.string().trim().max(64).nullable().optional(),
});

export const twoFactorSetupBodySchema = z.object({
  password: z.string().min(1, "Current password is required."),
});

export const twoFactorCodeBodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter a 6-digit verification code."),
});

export const attendanceCheckInBodySchema = z.object({
  code: z.string().regex(/^\d{4}$/, "Enter the 4-digit attendance code."),
});

export const attendanceStartBodySchema = z.object({
  validForSeconds: z.coerce.number().int().min(60).max(86400).optional(),
});

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  body: z.string().trim().min(1, "Body is required.").max(10000),
  type: z.enum(["general", "important", "contest", "lecture", "attendance"]),
});

export const announcementPatchSchema = announcementCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  type: z.enum(["pdf", "link", "file"]),
  url: z.string().trim().min(1).max(1000),
});

export const lectureCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(4000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  liveUrl: z.string().trim().max(1000).nullable().optional(),
  resources: z.array(resourceSchema).max(25).optional(),
});

export const lecturePatchSchema = lectureCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

export const contestCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(4000).optional(),
  mode: z.enum(["individual", "team"]).default("individual"),
  platform: z.literal("codeforces").default("codeforces"),
  platformContestId: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
  url: z.string().trim().url("Valid contest URL is required.").max(1000),
  invitationUrl: z.string().trim().max(1000).nullable().optional(),
  startsAt: z.string().min(1, "Start time is required."),
  durationMinutes: z.coerce.number().int().min(1).max(43200).optional(),
});

export const contestPatchSchema = contestCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

export const topicCreateSchema = z.object({
  name: z.string().trim().min(1, "Topic name is required.").max(120),
  slug: z.string().trim().min(1, "Slug is required.").max(120),
  order: z.coerce.number().int().min(0).max(10000).default(0),
});

export const topicPatchSchema = topicCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

export const problemCreateSchema = z.object({
  title: z.string().trim().min(1, "Problem title is required.").max(200),
  topicId: objectId(),
  platform: z.enum(["codeforces", "leetcode"]),
  url: z.string().trim().url("Valid problem URL is required.").max(500),
  value: z.coerce.number().int().min(0).max(10000).nullable().optional(),
  externalRef: z.object({
    contestId: z.coerce.number().int().positive().optional(),
    index: z.string().trim().max(10).optional(),
    titleSlug: z.string().trim().max(200).optional(),
  }),
});

export const problemPatchSchema = problemCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

export const teamCreateSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters.").max(80),
});

export const teamJoinSchema = z.object({
  inviteCode: z.string().trim().min(4, "Invite code is required.").max(16),
});

export const teamTransferSchema = z.object({
  userId: objectId(),
});

export const reasonBodySchema = z.object({
  reason: z.string().trim().max(500).nullable().optional(),
});
