import { withApi } from "@/lib/http/api.js";
import { publishAnnouncement } from "@/lib/services/announcements.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const POST = withApi(
  {
    permission: "announcements.publish",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return publishAnnouncement({ actor, correlationId, now }, input.params.id);
  },
);
