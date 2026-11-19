import { withApi } from "@/lib/http/api.js";
import { getContest } from "@/lib/services/contests.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "contests.read",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getContest({ actor, correlationId, now }, input.params.id);
  },
);
