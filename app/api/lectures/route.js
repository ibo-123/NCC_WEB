import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listLectures } from "@/lib/services/lectures.js";
import { paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "lectures.read",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listLectures({ actor, correlationId, now }, { page, limit });
  },
);
