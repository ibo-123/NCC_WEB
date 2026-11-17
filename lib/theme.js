// Theme cookie contract shared by the server layout and the client toggle. Dark is the default.
export const THEME_COOKIE = "ncc-theme";
export const THEMES = Object.freeze(["dark", "light"]);
export const DEFAULT_THEME = "dark";

/** Returns a valid theme name; anything else (missing, tampered) falls back to dark. */
export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : DEFAULT_THEME;
}
