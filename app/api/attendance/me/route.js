import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { getMyAttendance } from "@/lib/services/attendance.js";
import { paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "attendance.read",
    schemas: { query: paginationQuerySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return getMyAttendance({ actor, correlationId, now }, { page, limit });
  },
);
