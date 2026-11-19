import { withApi } from "@/lib/http/api.js";
import {
  deleteAnnouncement,
  getAdminAnnouncement,
  updateAnnouncement,
} from "@/lib/services/announcements.js";
import { announcementPatchSchema, idParamSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "announcements.manage",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAdminAnnouncement({ actor, correlationId, now }, input.params.id);
  },
);

export const PATCH = withApi(
  {
    permission: "announcements.manage",
    schemas: { params: idParamSchema, body: announcementPatchSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return updateAnnouncement({ actor, correlationId, now }, input.params.id, input.body);
  },
);

export const DELETE = withApi(
  {
    permission: "announcements.delete",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return deleteAnnouncement({ actor, correlationId, now }, input.params.id);
  },
);
