import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { clientIpFromRequest } from "@/lib/security/rateLimit.js";
import { registerUser } from "@/lib/services/auth.js";
import { registerBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    public: { reason: "No account exists yet (policy gated by REGISTRATION_MODE, B3)" },
    schemas: { body: registerBodySchema },
  },
  async ({ request, input, correlationId, now }) => {
    const clientIp = clientIpFromRequest(request);
    const data = await registerUser(
      { actor: null, correlationId, now },
      { ...input.body, clientIp },
    );
    return ok(data, { status: 201 });
  },
);
