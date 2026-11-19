import { withApi } from "@/lib/http/api.js";
import { getUser } from "@/lib/services/users.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "users.read",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getUser({ actor, correlationId, now }, input.params.id);
  },
);
