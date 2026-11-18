"use client";

import { Search, X } from "lucide-react";
import { cx } from "./cx.js";

export function SearchInput({ value, onChange, placeholder = "Search...", label, className }) {
  return (
    <label
      className={cx(
        "flex h-10 min-w-[min(260px,100%)] flex-1 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3.5",
        "focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--focus-ring)]",
        className,
      )}
    >
      <span className="sr-only">{label ?? placeholder}</span>
      <Search aria-hidden="true" size={17} className="flex-none text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full border-0 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="grid size-6 flex-none cursor-pointer place-items-center rounded text-muted hover:bg-sunken hover:text-fg"
        >
          <X aria-hidden="true" size={14} />
        </button>
      ) : null}
    </label>
  );
}
