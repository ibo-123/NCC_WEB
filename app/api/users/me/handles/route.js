import { withApi } from "@/lib/http/api.js";
import { updateHandles } from "@/lib/services/auth.js";
import { handlesBodySchema } from "@/lib/validation/routes.js";

export const PUT = withApi(
  {
    permission: "profile.handles.update",
    schemas: { body: handlesBodySchema },
  },
  async ({ actor, session, input, correlationId, now }) => {
    return updateHandles({ actor, session, correlationId, now }, input.body);
  },
);
