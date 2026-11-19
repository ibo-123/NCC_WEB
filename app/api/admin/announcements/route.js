import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { ok } from "@/lib/http/response.js";
import { createAnnouncement, listAdminAnnouncements } from "@/lib/services/announcements.js";
import { announcementCreateSchema, paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "announcements.manage",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminAnnouncements({ actor, correlationId, now }, { page, limit });
  },
);

export const POST = withApi(
  {
    permission: "announcements.manage",
    schemas: { body: announcementCreateSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const created = await createAnnouncement({ actor, correlationId, now }, input.body);
    return ok(created, { status: 201 });
  },
);
