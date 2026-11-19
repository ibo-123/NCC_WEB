import { serializeSessionCookie } from "@/lib/auth/session.js";
import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { verifyTwoFactor } from "@/lib/services/auth.js";
import { twoFactorCodeBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "auth.2fa.verify",
    schemas: { body: twoFactorCodeBodySchema },
  },
  async ({ actor, session, input, correlationId, now }) => {
    const { user, rawToken, expiresAt } = await verifyTwoFactor(
      { actor, session, correlationId, now },
      input.body,
    );
    return ok(
      { user },
      {
        headers: {
          "set-cookie": serializeSessionCookie(rawToken, expiresAt, now),
        },
      },
    );
  },
);
