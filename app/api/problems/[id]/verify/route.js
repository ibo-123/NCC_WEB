import { withApi } from "@/lib/http/api.js";
import { checkSolve } from "@/lib/services/progress.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "problems.check",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return checkSolve({ actor, correlationId, now }, input.params.id);
  },
);
