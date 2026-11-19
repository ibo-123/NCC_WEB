import { withApi } from "@/lib/http/api.js";
import { getStudentDashboard } from "@/lib/services/dashboard.js";

export const GET = withApi(
  { permission: "dashboard.read" },
  async ({ actor, session, correlationId, now }) => {
    return getStudentDashboard({ actor, session, correlationId, now });
  },
);
