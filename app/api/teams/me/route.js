import { withApi } from "@/lib/http/api.js";
import { getMyTeam } from "@/lib/services/teams.js";

export const GET = withApi(
  { permission: "teams.read" },
  async ({ actor, correlationId, now }) => {
    return getMyTeam({ actor, correlationId, now });
  },
);
