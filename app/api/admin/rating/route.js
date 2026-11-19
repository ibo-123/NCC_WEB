import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listAdminRating } from "@/lib/services/rating.js";
import { paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "rating.admin.read",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminRating({ actor, correlationId, now }, { page, limit });
  },
);
