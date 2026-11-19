import { withApi } from "@/lib/http/api.js";
import { getLecture } from "@/lib/services/lectures.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "lectures.read",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getLecture({ actor, correlationId, now }, input.params.id);
  },
);
