import { register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootUrl = pathToFileURL(`${path.resolve(process.cwd())}/`).href;

const hookSource = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = ${JSON.stringify(rootUrl)} + specifier.slice(2);
    return nextResolve(target, context);
  }
  return nextResolve(specifier, context);
}
`;

register(`data:text/javascript;base64,${Buffer.from(hookSource).toString("base64")}`);
