import { withApi } from "@/lib/http/api.js";
import { getCurrentUser } from "@/lib/services/auth.js";

export const GET = withApi(
  { permission: "auth.me" },
  async ({ actor, session, correlationId, now }) => {
    return getCurrentUser({ actor, session, correlationId, now });
  },
);
