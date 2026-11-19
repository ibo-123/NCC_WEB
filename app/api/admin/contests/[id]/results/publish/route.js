import { withApi } from "@/lib/http/api.js";
import { publishResults } from "@/lib/services/contests.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "results.publish",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return publishResults({ actor, correlationId, now }, input.params.id);
  },
);
