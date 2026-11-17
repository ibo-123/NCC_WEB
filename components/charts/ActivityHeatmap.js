"use client";

import { useState } from "react";

const HEAT_VARS = [
  "var(--heat-0)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
];

/**
 * 18-week qualifying activity heatmap using --heat-0..4 tokens,
 * styled after the reference heatmap with top-right Low-High ramp and interactive cell inspection.
 */
export function ActivityHeatmap({
  cells = [],
  caption = "Each cell is a campus day. Filled cells have qualifying activity recorded.",
}) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        {selected ? (
          <span className="font-mono text-fg tabular-nums">
            {selected.date} · {selected.count} {selected.count === 1 ? "activity" : "activities"}
          </span>
        ) : (
          <span>Hover or select any day tile to inspect activity</span>
        )}
        <div className="flex items-center gap-1.5">
          <span>Low</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={lvl}
              aria-hidden="true"
              className="block size-3 rounded-[3px]"
              style={{ background: HEAT_VARS[lvl] }}
            />
          ))}
          <span>High</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="grid w-max grid-flow-col grid-rows-7 gap-1"
          role="img"
          aria-label="Daily qualifying activity heatmap. Older days are on the left."
        >
          {cells.map((cell, i) => {
            const isSelected = selected?.date === cell.date;
            return (
              <button
                key={cell.date ?? i}
                type="button"
                onMouseEnter={() => setSelected(cell)}
                onFocus={() => setSelected(cell)}
                onClick={() => setSelected(cell)}
                aria-label={`${cell.date}: ${cell.count} qualifying ${cell.count === 1 ? "event" : "events"}`}
                className="block size-3.5 cursor-pointer rounded-[3px] border border-transparent p-0 transition-transform duration-100 hover:scale-110 focus-visible:ring-1 focus-visible:ring-focus"
                style={{
                  background: HEAT_VARS[Math.max(0, Math.min(4, cell.level ?? 0))],
                  borderColor: isSelected ? "var(--text)" : "transparent",
                }}
              />
            );
          })}
        </div>
      </div>

      <p className="m-0 text-xs text-muted">{caption}</p>
    </div>
  );
}
