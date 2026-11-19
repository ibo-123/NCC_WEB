import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listContests } from "@/lib/services/contests.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  mode: z.enum(["individual", "team"]).optional(),
});

export const GET = withApi(
  {
    permission: "contests.read",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listContests({ actor, correlationId, now }, { page, limit, mode: input.query.mode });
  },
);
