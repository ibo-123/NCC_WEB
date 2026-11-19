import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { ok } from "@/lib/http/response.js";
import { createContest, listAdminContests } from "@/lib/services/contests.js";
import { contestCreateSchema } from "@/lib/validation/routes.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  mode: z.enum(["individual", "team"]).optional(),
});

export const GET = withApi(
  {
    permission: "contests.manage",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminContests({ actor, correlationId, now }, { page, limit, mode: input.query.mode });
  },
);

export const POST = withApi(
  {
    permission: "contests.manage",
    schemas: { body: contestCreateSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const created = await createContest({ actor, correlationId, now }, input.body);
    return ok(created, { status: 201 });
  },
);
