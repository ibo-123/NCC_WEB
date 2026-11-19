import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listUsers } from "@/lib/services/users.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  q: z.string().max(120).optional(),
  role: z.enum(["student", "admin"]).optional(),
  status: z.enum(["active", "restricted"]).optional(),
});

export const GET = withApi(
  {
    permission: "users.read",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listUsers(
      { actor, correlationId, now },
      { page, limit, q: input.query.q, role: input.query.role, status: input.query.status },
    );
  },
);
