import { withApi } from "@/lib/http/api.js";
import { leaveTeam } from "@/lib/services/teams.js";

export const POST = withApi(
  { permission: "teams.manage" },
  async ({ actor, correlationId, now }) => {
    return leaveTeam({ actor, correlationId, now });
  },
);
