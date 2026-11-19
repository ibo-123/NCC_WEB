import { withApi } from "@/lib/http/api.js";
import { restrictUser } from "@/lib/services/users.js";
import { idParamSchema, reasonBodySchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "users.restrict",
    schemas: { params: idParamSchema, body: reasonBodySchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return restrictUser({ actor, correlationId, now }, input.params.id, input.body);
  },
);
