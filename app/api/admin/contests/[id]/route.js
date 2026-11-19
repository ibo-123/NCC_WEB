import { withApi } from "@/lib/http/api.js";
import { deleteContest, getAdminContest, updateContest } from "@/lib/services/contests.js";
import { contestPatchSchema, idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "contests.manage",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAdminContest({ actor, correlationId, now }, input.params.id);
  },
);

export const PATCH = withApi(
  {
    permission: "contests.manage",
    schemas: { params: idParamSchema, body: contestPatchSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return updateContest({ actor, correlationId, now }, input.params.id, input.body);
  },
);

export const DELETE = withApi(
  {
    permission: "contests.delete",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return deleteContest({ actor, correlationId, now }, input.params.id);
  },
);
