import { withApi } from "@/lib/http/api.js";
import { disbandTeam } from "@/lib/services/teams.js";

export const POST = withApi(
  { permission: "teams.manage" },
  async ({ actor, correlationId, now }) => {
    return disbandTeam({ actor, correlationId, now });
  },
);
