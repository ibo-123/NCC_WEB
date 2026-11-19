import { withApi } from "@/lib/http/api.js";
import { getMyRating } from "@/lib/services/rating.js";

export const GET = withApi(
  { permission: "rating.read" },
  async ({ actor, correlationId, now }) => {
    return getMyRating({ actor, correlationId, now });
  },
);
