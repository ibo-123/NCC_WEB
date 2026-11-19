import { withApi } from "@/lib/http/api.js";
import { getAdminTeam } from "@/lib/services/teams.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "teams.admin.read",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAdminTeam({ actor, correlationId, now }, input.params.id);
  },
);
