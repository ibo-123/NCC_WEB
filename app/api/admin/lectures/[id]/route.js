import { withApi } from "@/lib/http/api.js";
import { deleteLecture, getAdminLecture, updateLecture } from "@/lib/services/lectures.js";
import { idParamSchema, lecturePatchSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "lectures.manage",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAdminLecture({ actor, correlationId, now }, input.params.id);
  },
);

export const PATCH = withApi(
  {
    permission: "lectures.manage",
    schemas: { params: idParamSchema, body: lecturePatchSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return updateLecture({ actor, correlationId, now }, input.params.id, input.body);
  },
);

export const DELETE = withApi(
  {
    permission: "lectures.delete",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return deleteLecture({ actor, correlationId, now }, input.params.id);
  },
);
