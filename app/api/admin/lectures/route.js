import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { ok } from "@/lib/http/response.js";
import { createLecture, listAdminLectures } from "@/lib/services/lectures.js";
import { lectureCreateSchema, paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "lectures.manage",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminLectures({ actor, correlationId, now }, { page, limit });
  },
);

export const POST = withApi(
  {
    permission: "lectures.manage",
    schemas: { body: lectureCreateSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const created = await createLecture({ actor, correlationId, now }, input.body);
    return ok(created, { status: 201 });
  },
);
