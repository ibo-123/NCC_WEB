import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { startAttendance } from "@/lib/services/attendance.js";
import { attendanceStartBodySchema, idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "attendance.manage",
    schemas: { params: idParamSchema, body: attendanceStartBodySchema.optional() },
  },
  async ({ actor, input, correlationId, now }) => {
    const sess = await startAttendance(
      { actor, correlationId, now },
      input.params.id,
      input.body ?? {},
    );
    return ok(sess, { status: 201 });
  },
);
