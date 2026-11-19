import { withApi } from "@/lib/http/api.js";
import { fetchResults } from "@/lib/services/contests.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "results.fetch",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return fetchResults({ actor, correlationId, now }, input.params.id);
  },
);
