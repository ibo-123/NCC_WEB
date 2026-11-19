import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { ok } from "@/lib/http/response.js";
import { createTopic, listAdminTopics } from "@/lib/services/progress.js";
import { paginationQuerySchema, topicCreateSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "topics.manage",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAdminTopics({ actor, correlationId, now }, { page, limit });
  },
);

export const POST = withApi(
  {
    permission: "topics.manage",
    schemas: { body: topicCreateSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const created = await createTopic({ actor, correlationId, now }, input.body);
    return ok(created, { status: 201 });
  },
);
