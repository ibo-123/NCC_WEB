import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));

export function readDoc(relativePath) {
  return readFileSync(root + relativePath, "utf8");
}

/** Text between two headings (start inclusive, end exclusive). */
export function between(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  if (start === -1) throw new Error(`Heading not found: ${startHeading}`);
  const end = endHeading ? text.indexOf(endHeading, start + startHeading.length) : text.length;
  if (end === -1) throw new Error(`Heading not found: ${endHeading}`);
  return text.slice(start, end);
}

/** Markdown table rows as arrays of trimmed cells (header and separator rows skipped). */
export function tableRows(text) {
  return text
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .replace(/\\\|/g, "\u0000")
        .slice(1, line.endsWith("|") ? -1 : undefined)
        .split("|")
        .map((cell) => cell.replace(/\u0000/g, "|").trim()),
    )
    .filter((cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

export const PERMISSION = /^[a-z]+(?:\.[a-zA-Z0-9]+)+$/;

/** Backticked tokens inside a cell. */
export function codeTokens(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}
