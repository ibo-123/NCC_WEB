import { withApi } from "@/lib/http/api.js";
import { transferCaptain } from "@/lib/services/teams.js";
import { teamTransferSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "teams.manage",
    schemas: { body: teamTransferSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return transferCaptain({ actor, correlationId, now }, input.body.userId);
  },
);
