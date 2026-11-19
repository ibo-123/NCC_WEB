import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listAdminTeams } from "@/lib/services/teams.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  q: z.string().max(120).optional(),
  status: z.enum(["active", "disbanded"]).optional(),
});

export const GET = withApi(
  {
    permission: "teams.admin.read",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminTeams(
      { actor, correlationId, now },
      { page, limit, q: input.query.q, status: input.query.status },
    );
  },
);
