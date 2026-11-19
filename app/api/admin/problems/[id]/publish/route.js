import { withApi } from "@/lib/http/api.js";
import { publishProblem } from "@/lib/services/progress.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "problems.publish",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return publishProblem({ actor, correlationId, now }, input.params.id);
  },
);
