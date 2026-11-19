import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { getAttendanceSession } from "@/lib/services/attendance.js";
import { paginationQuerySchema, sessionIdParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "attendance.admin.read",
    schemas: { params: sessionIdParamSchema, query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return getAttendanceSession({ actor, correlationId, now }, input.params.sessionId, {
      page,
      limit,
    });
  },
);
