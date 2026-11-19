import { withApi } from "@/lib/http/api.js";
import { adminDisbandTeam } from "@/lib/services/teams.js";
import { idParamSchema, reasonBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "teams.admin.manage",
    schemas: { params: idParamSchema, body: reasonBodySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return adminDisbandTeam({ actor, correlationId, now }, input.params.id, input.body);
  },
);
