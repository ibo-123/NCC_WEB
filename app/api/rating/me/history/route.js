import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listRatingHistory } from "@/lib/services/rating.js";
import { paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "rating.read",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listRatingHistory({ actor, correlationId, now }, { page, limit });
  },
);
