import { withApi } from "@/lib/http/api.js";
import { joinTeam } from "@/lib/services/teams.js";
import { teamJoinSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "teams.manage",
    schemas: { body: teamJoinSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return joinTeam({ actor, correlationId, now }, input.body);
  },
);
