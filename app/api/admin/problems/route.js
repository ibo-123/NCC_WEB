import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { ok } from "@/lib/http/response.js";
import { createProblem, listAdminProblems } from "@/lib/services/progress.js";
import { objectId } from "@/lib/validation/index.js";
import { problemCreateSchema } from "@/lib/validation/routes.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  topicId: objectId().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const GET = withApi(
  {
    permission: "problems.manage",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminProblems(
      { actor, correlationId, now },
      { page, limit, topicId: input.query.topicId, status: input.query.status },
    );
  },
);

export const POST = withApi(
  {
    permission: "problems.manage",
    schemas: { body: problemCreateSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const created = await createProblem({ actor, correlationId, now }, input.body);
    return ok(created, { status: 201 });
  },
);
