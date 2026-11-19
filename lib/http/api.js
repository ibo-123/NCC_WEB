import { configureWithApi, withApi } from "./withApi.js";
import { checkMutatingRequest } from "@/lib/security/csrf.js";
import { resolveAccess } from "@/lib/auth/session.js";

configureWithApi({
  checkMutatingRequest,
  resolveAccess,
});

export { withApi };
