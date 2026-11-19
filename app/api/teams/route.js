import { withApi } from "@/lib/http/api.js";
import { ok } from "@/lib/http/response.js";
import { createTeam } from "@/lib/services/teams.js";
import { teamCreateSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "teams.manage",
    schemas: { body: teamCreateSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    const team = await createTeam({ actor, correlationId, now }, input.body);
    return ok(team, { status: 201 });
  },
);
