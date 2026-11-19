import { withApi } from "@/lib/http/api.js";
import { getAnnouncement } from "@/lib/services/announcements.js";
import { idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "announcements.read",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAnnouncement({ actor, correlationId, now }, input.params.id);
  },
);
