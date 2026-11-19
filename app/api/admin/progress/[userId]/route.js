import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { getStudentProgress } from "@/lib/services/progress.js";
import { paginationQuerySchema, userIdParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "progress.admin.read",
    schemas: { params: userIdParamSchema, query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return getStudentProgress({ actor, correlationId, now }, input.params.userId, { page, limit });
  },
);
