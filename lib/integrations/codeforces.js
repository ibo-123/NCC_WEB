import crypto from "node:crypto";
import { getEnv } from "@/lib/config/env.js";
import { AppError } from "@/lib/http/errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const BASE_URL = "https://codeforces.com/api";

function buildCodeforcesUrl(method, params) {
  const url = new URL(`${BASE_URL}/${method}`);
  const allParams = new Map();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) allParams.set(k, String(v));
  }

  const cf = getEnv().codeforces;
  if (cf?.apiKey && cf?.apiSecret) {
    const rand = crypto.randomBytes(3).toString("hex");
    allParams.set("apiKey", cf.apiKey);
    allParams.set("time", String(Math.floor(Date.now() / 1000)));
    const sorted = [...allParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    const queryStr = sorted.map(([k, v]) => `${k}=${v}`).join("&");
    const sigBase = `${rand}/${method}?${queryStr}#${cf.apiSecret}`;
    const hash = crypto.createHash("sha512").update(sigBase).digest("hex");
    allParams.set("apiSig", `${rand}${hash}`);
  }

  for (const [k, v] of allParams.entries()) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

async function callCodeforcesApi(method, params, { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch } = {}) {
  const url = buildCodeforcesUrl(method, params);
  let lastErr = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      if (!response.ok) {
        lastErr = new Error(`HTTP ${response.status}`);
        if (response.status >= 500 && attempt === 0) continue;
        throw new AppError("UPSTREAM_ERROR", {
          message: "Codeforces API returned an error response.",
        });
      }
      const payload = await response.json();
      if (!payload || payload.status !== "OK") {
        throw new AppError("UPSTREAM_ERROR", {
          message: payload?.comment ? `Codeforces: ${payload.comment}` : "Codeforces API request failed.",
        });
      }
      return payload.result;
    } catch (err) {
      if (err instanceof AppError) throw err;
      lastErr = err;
      if (attempt === 0) continue;
    }
  }

  throw new AppError("UPSTREAM_ERROR", {
    message: lastErr?.name === "TimeoutError"
      ? "Codeforces API request timed out."
      : "Unable to reach Codeforces API.",
  });
}

/**
 * Fetches recent submissions for a Codeforces handle.
 */
export async function fetchUserSubmissions(handle, { count = 200, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl } = {}) {
  const result = await callCodeforcesApi(
    "user.status",
    { handle: String(handle).trim(), from: 1, count },
    { timeoutMs, fetchImpl },
  );
  if (!Array.isArray(result)) return [];
  return result.map((sub) => ({
    id: sub.id,
    contestId: sub.contestId ?? sub.problem?.contestId ?? null,
    index: sub.problem?.index ?? null,
    verdict: sub.verdict ?? null,
    creationTimeSeconds: sub.creationTimeSeconds ?? null,
  }));
}

/**
 * Fetches official standings rows for a Codeforces contest.
 */
export async function fetchContestStandings(platformContestId, { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl } = {}) {
  const result = await callCodeforcesApi(
    "contest.standings",
    { contestId: String(platformContestId).trim(), from: 1, count: 1000, showUnofficial: "false" },
    { timeoutMs, fetchImpl },
  );
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  const entries = [];
  for (const row of rows) {
    const members = Array.isArray(row?.party?.members) ? row.party.members : [];
    for (const member of members) {
      if (!member?.handle) continue;
      entries.push({
        handle: String(member.handle).trim(),
        rank: Number(row.rank ?? 0),
        points: Number(row.points ?? 0),
        penalty: Number(row.penalty ?? 0),
      });
    }
  }
  return entries;
}
