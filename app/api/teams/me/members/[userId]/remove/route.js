import { withApi } from "@/lib/http/api.js";
import { removeMember } from "@/lib/services/teams.js";
import { userIdParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "teams.manage",
    schemas: { params: userIdParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return removeMember({ actor, correlationId, now }, input.params.userId);
  },
);
