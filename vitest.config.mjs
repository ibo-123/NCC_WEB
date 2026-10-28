import { transformWithOxc } from "vite"; // installed with vitest; not a direct dependency
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Components are .js files that contain JSX (Next compiles them the same way). Vite only parses JSX in
// .jsx files, so this plugin compiles JSX in the component and app folders before Vite's own transform.
const jsxInJs = {
  name: "jsx-in-js",
  enforce: "pre",
  async transform(code, id) {
    const path = id.split("?")[0];
    if (!/\/(components|app)\/.+\.js$/.test(path)) return null;
    const result = await transformWithOxc(code, `${path}x`, { jsx: { runtime: "automatic" } });
    return { code: result.code, map: result.map };
  },
};

export default defineConfig({
  plugins: [jsxInJs],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
