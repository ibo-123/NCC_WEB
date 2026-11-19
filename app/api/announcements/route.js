import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listAnnouncements } from "@/lib/services/announcements.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(["general", "important", "contest", "lecture", "attendance"]).optional(),
  q: z.string().max(120).optional(),
});

export const GET = withApi(
  {
    permission: "announcements.read",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAnnouncements(
      { actor, correlationId, now },
      { page, limit, type: input.query.type, q: input.query.q },
    );
  },
);
