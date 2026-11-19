import { z } from "zod";
import { withApi } from "@/lib/http/api.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { listAttendanceSessions } from "@/lib/services/attendance.js";
import { objectId } from "@/lib/validation/index.js";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  lectureId: objectId().optional(),
});

export const GET = withApi(
  {
    permission: "attendance.admin.read",
    schemas: { query: querySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const { page, limit } = parsePagination(input.query);
    return listAttendanceSessions(
      { actor, correlationId, now },
      { page, limit, lectureId: input.query.lectureId },
    );
  },
);
