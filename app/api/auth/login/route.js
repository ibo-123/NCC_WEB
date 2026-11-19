import { serializeSessionCookie } from "@/lib/auth/session.js";
import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { clientIpFromRequest } from "@/lib/security/rateLimit.js";
import { loginUser } from "@/lib/services/auth.js";
import { loginBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    public: { reason: "No session exists yet" },
    schemas: { body: loginBodySchema },
  },
  async ({ request, input, correlationId, now }) => {
    const clientIp = clientIpFromRequest(request);
    const userAgent = request.headers.get("user-agent") ?? null;
    const { user, requiresTwoFactor, rawToken, expiresAt } = await loginUser(
      { actor: null, correlationId, now },
      { ...input.body, clientIp, userAgent },
    );
    return ok(
      { user, requiresTwoFactor },
      {
        headers: {
          "set-cookie": serializeSessionCookie(rawToken, expiresAt, now),
        },
      },
    );
  },
);
