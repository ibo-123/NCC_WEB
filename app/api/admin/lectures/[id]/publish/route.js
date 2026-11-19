import { withApi } from "@/lib/http/api.js";
import { publishLecture } from "@/lib/services/lectures.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "lectures.publish",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return publishLecture({ actor, correlationId, now }, input.params.id);
  },
);
