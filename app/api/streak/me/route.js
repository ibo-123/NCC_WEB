import { withApi } from "@/lib/http/api.js";
import { getStreak } from "@/lib/services/streak.js";

export const GET = withApi(
  { permission: "streak.read" },
  async ({ actor, correlationId, now }) => {
    return getStreak({ actor, correlationId, now });
  },
);
