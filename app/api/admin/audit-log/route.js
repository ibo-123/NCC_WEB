import { withApi } from "@/lib/http/api.js";
import { listAuditEntries } from "@/lib/db/audit.js";
import { parsePagination } from "@/lib/http/pagination.js";
import { paginationQuerySchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "auditlog.read",
    schemas: { query: paginationQuerySchema },
  },
  async ({ input }) => {
    const { page, limit } = parsePagination(input.query);
    return listAuditEntries({ page, limit });
  },
);
