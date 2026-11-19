import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listResults } from "@/lib/services/contests.js";
import { idParamSchema } from "@/lib/validation/routes.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  q: z.string().max(120).optional(),
});

export const GET = withApi(
  {
    permission: "results.read",
    schemas: { params: idParamSchema, query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listResults(
      { actor, correlationId, now },
      input.params.id,
      { page, limit, q: input.query.q },
    );
  },
);
