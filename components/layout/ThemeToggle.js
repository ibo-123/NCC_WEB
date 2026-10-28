"use client";

import { Moon, Sun } from "lucide-react";
import { normalizeTheme, THEME_COOKIE } from "@/lib/theme.js";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Flips <html data-theme> and stores the choice in a cookie so the server renders it next time. */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = normalizeTheme(root.dataset.theme) === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  }

  // Both icons are rendered and CSS picks one from <html data-theme>, so there is no hydration mismatch.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between dark and light theme"
      className="grid size-10 cursor-pointer place-items-center rounded-lg border border-transparent bg-transparent text-fg-2 hover:bg-sunken"
    >
      <Sun aria-hidden="true" size={18} className="hidden dark:block" />
      <Moon aria-hidden="true" size={18} className="block dark:hidden" />
    </button>
  );
}
