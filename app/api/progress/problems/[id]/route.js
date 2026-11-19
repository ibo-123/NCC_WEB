import { withApi } from "@/lib/http/api.js";
import { getProblemProgress } from "@/lib/services/progress.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "problems.read",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getProblemProgress({ actor, correlationId, now }, input.params.id);
  },
);
