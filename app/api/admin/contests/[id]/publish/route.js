import { withApi } from "@/lib/http/api.js";
import { publishContest } from "@/lib/services/contests.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "contests.publish",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return publishContest({ actor, correlationId, now }, input.params.id);
  },
);
