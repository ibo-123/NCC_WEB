import { serializeClearSessionCookie } from "@/lib/auth/session.js";
import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { logoutSession } from "@/lib/services/auth.js";

export const POST = withApi(
  { permission: "auth.logout" },
  async ({ actor, session, correlationId, now }) => {
    await logoutSession({ actor, session, correlationId, now });
    return ok({}, { headers: { "set-cookie": serializeClearSessionCookie() } });
  },
);
