import { withApi } from "@/lib/http/api.js";
import { deleteProblem, getAdminProblem, updateProblem } from "@/lib/services/progress.js";
import { idParamSchema, problemPatchSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "problems.manage",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAdminProblem({ actor, correlationId, now }, input.params.id);
  },
);

export const PATCH = withApi(
  {
    permission: "problems.manage",
    schemas: { params: idParamSchema, body: problemPatchSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return updateProblem({ actor, correlationId, now }, input.params.id, input.body);
  },
);

export const DELETE = withApi(
  {
    permission: "problems.delete",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return deleteProblem({ actor, correlationId, now }, input.params.id);
  },
);
