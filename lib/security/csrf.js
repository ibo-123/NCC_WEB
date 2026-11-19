import { assertConfigReady, isProduction } from "@/lib/config/env.js";

/**
 * Validates Origin and Content-Type on mutating requests (AUTH_AND_SECURITY.md §10).
 * Returns `{ ok: true }` or `{ ok: false, reason: "origin" | "non-json" }`.
 */
export function checkMutatingRequest(request) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return { ok: false, reason: "origin" };
  }

  let parsedOrigin;
  try {
    parsedOrigin = new URL(originHeader);
  } catch {
    return { ok: false, reason: "origin" };
  }

  const { appUrl } = assertConfigReady("core");
  const expectedOrigin = new URL(appUrl).origin;

  if (parsedOrigin.origin !== expectedOrigin) {
    const secFetchSite = request.headers.get("sec-fetch-site");
    const forwardedHost =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host")?.trim();
    const requestHost = forwardedHost || (() => {
      try {
        return new URL(request.url).host;
      } catch {
        return "";
      }
    })();

    const isSameProxyHost =
      secFetchSite === "same-origin" &&
      Boolean(forwardedHost) &&
      parsedOrigin.host === forwardedHost;

    const isDevLocalLoopback =
      !isProduction() &&
      (parsedOrigin.hostname === "localhost" || parsedOrigin.hostname === "127.0.0.1") &&
      Boolean(requestHost) &&
      parsedOrigin.host === requestHost;

    if (!isSameProxyHost && !isDevLocalLoopback) {
      return { ok: false, reason: "origin" };
    }
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { ok: false, reason: "non-json" };
  }

  return { ok: true };
}
