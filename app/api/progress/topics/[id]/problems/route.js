import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listTopicProblems } from "@/lib/services/progress.js";
import { idParamSchema, paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "progress.read",
    schemas: { params: idParamSchema, query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listTopicProblems({ actor, correlationId, now }, input.params.id, { page, limit });
  },
);
