import { withApi } from "@/lib/http/api.js";
import { deleteTopic, getAdminTopic, updateTopic } from "@/lib/services/progress.js";
import { idParamSchema, topicPatchSchema } from "@/lib/validation/routes.js";

export const GET = withApi(
  {
    permission: "topics.manage",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return getAdminTopic({ actor, correlationId, now }, input.params.id);
  },
);

export const PATCH = withApi(
  {
    permission: "topics.manage",
    schemas: { params: idParamSchema, body: topicPatchSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return updateTopic({ actor, correlationId, now }, input.params.id, input.body);
  },
);

export const DELETE = withApi(
  {
    permission: "topics.delete",
    schemas: { params: idParamSchema },
  },
  async ({ actor, input, correlationId, now }) => {
    return deleteTopic({ actor, correlationId, now }, input.params.id);
  },
);
