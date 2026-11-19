import { withApi } from "@/lib/http/api.js";
import { closeAttendance } from "@/lib/services/attendance.js";
import { sessionIdParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "attendance.manage",
    schemas: { params: sessionIdParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return closeAttendance({ actor, correlationId, now }, input.params.sessionId);
  },
);
