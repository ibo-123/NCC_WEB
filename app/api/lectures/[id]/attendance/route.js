import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { clientIpFromRequest } from "@/lib/security/rateLimit.js";
import { checkIn } from "@/lib/services/attendance.js";
import { attendanceCheckInBodySchema, idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "attendance.checkin",
    schemas: { params: idParamSchema, body: attendanceCheckInBodySchema },
  },
  async ({ request, actor, input, correlationId, now }) => {
    const clientIp = clientIpFromRequest(request);
    const data = await checkIn(
      { actor, correlationId, now },
      input.params.id,
      input.body.code,
      { clientIp },
    );
    return ok(data, { status: 201 });
  },
);
