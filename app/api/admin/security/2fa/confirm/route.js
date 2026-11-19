import { withApi } from "@/lib/http/api.js";
import { confirmTwoFactorEnrollment } from "@/lib/services/auth.js";
import { twoFactorCodeBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "twofa.enroll",
    schemas: { body: twoFactorCodeBodySchema },
  },
  async ({ actor, session, input, correlationId, now }) => {
    return confirmTwoFactorEnrollment({ actor, session, correlationId, now }, input.body);
  },
);
