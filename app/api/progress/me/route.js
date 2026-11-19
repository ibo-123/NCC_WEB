import { withApi } from "@/lib/http/api.js";
import { getMyProgress } from "@/lib/services/progress.js";

export const GET = withApi(
  { permission: "progress.read" },
  async ({ actor, correlationId, now }) => {
    return getMyProgress({ actor, correlationId, now });
  },
);
