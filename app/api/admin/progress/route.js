import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listProgressByStudent } from "@/lib/services/progress.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  q: z.string().max(120).optional(),
});

export const GET = withApi(
  {
    permission: "progress.admin.read",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listProgressByStudent({ actor, correlationId, now }, { page, limit, q: input.query.q });
  },
);
