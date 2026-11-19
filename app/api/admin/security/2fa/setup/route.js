import { withApi } from "@/lib/http/api.js";
import { startTwoFactorEnrollment } from "@/lib/services/auth.js";
import { twoFactorSetupBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "twofa.enroll",
    schemas: { body: twoFactorSetupBodySchema },
  },
  async ({ actor, session, input, correlationId, now }) => {
    return startTwoFactorEnrollment({ actor, session, correlationId, now }, input.body);
  },
);
