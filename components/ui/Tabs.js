"use client";

import { cx } from "./cx.js";

/**
 * Accessible segmented tabs / mode switcher (e.g. Individual | Group).
 * items: [{ id, label, count? }]
 */
export function Tabs({ items, activeId, onChange, ariaLabel = "Sections" }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-[3px] border border-border bg-sunken p-1"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[2px] px-3 font-mono text-[13px] font-semibold whitespace-nowrap transition-colors",
              active ? "bg-primary text-primary-text" : "text-fg-2 hover:bg-surface hover:text-fg",
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined ? (
              <span className={cx("tabular-nums text-xs", active ? "opacity-85" : "text-muted")}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
