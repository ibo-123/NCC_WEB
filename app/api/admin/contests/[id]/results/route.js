import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listFetchedResults } from "@/lib/services/contests.js";
import { idParamSchema, paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "contests.manage",
    schemas: { params: idParamSchema, query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listFetchedResults({ actor, correlationId, now }, input.params.id, { page, limit });
  },
);
