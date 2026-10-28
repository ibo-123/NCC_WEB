import { AppError } from "@/lib/http/errors.js";

// Test doubles for the dependencies withApi receives from A4. Tests only.

export const readyConfig = () => {};

export function fakeAccess({ user = { id: "u1", role: "student" }, session = { id: "s1" } } = {}) {
  const calls = [];
  const fn = async (request, declaration) => {
    calls.push(declaration);
    return { user, session };
  };
  fn.calls = calls;
  return fn;
}

export function denyingAccess(code) {
  const fn = async () => {
    fn.called = true;
    throw new AppError(code);
  };
  return fn;
}

export const allowCsrf = async () => ({ ok: true });
export const rejectCsrf = (reason) => async () => ({ ok: false, reason });

export function jsonRequest(url, { method = "GET", body, headers } = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost:3000", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}
