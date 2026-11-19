import { withApi } from "@/lib/http/api.js";
import { getAdminDashboard } from "@/lib/services/dashboard.js";

export const GET = withApi(
  { permission: "admin.dashboard.read" },
  async () => {
    return getAdminDashboard();
  },
);
