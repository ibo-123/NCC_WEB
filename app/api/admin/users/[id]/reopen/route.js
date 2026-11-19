import { withApi } from "@/lib/http/api.js";
import { reopenUser } from "@/lib/services/users.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "users.reopen",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return reopenUser({ actor, correlationId, now }, input.params.id);
  },
);
