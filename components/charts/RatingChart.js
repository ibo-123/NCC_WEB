"use client";

import { useState } from "react";

/**
 * Responsive SVG line chart for NCC_DSA rating history (1.00 - 5.00 scale).
 * Supports hover/focus inspection of individual data points.
 */
export function RatingChart({ points = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!points.length) return null;

  const w = 720;
  const h = 250;
  const pl = 36;
  const pr = 18;
  const pt = 18;
  const pb = 34;
  const min = 1;
  const max = 5;
  const iw = w - pl - pr;
  const ih = h - pt - pb;

  const coords = points.map((p, i) => {
    const x = pl + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
    const y = pt + (1 - (p.value - min) / (max - min)) * ih;
    return { x, y, ...p };
  });

  const pathD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const activePoint = activeIndex !== null ? coords[activeIndex] : null;

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Scale: 1.00 – 5.00</span>
        {activePoint ? (
          <span className="font-mono text-fg tabular-nums">
            {activePoint.label}: <strong>{activePoint.value.toFixed(2)}</strong>
            {activePoint.change !== null && activePoint.change !== undefined
              ? ` (${activePoint.change >= 0 ? "+" : ""}${activePoint.change.toFixed(2)})`
              : ""}
          </span>
        ) : (
          <span>Select or hover a point to inspect</span>
        )}
      </div>
      <svg
        className="block h-auto w-full"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Rating history chart from 1.00 to 5.00"
      >
        {[1, 2, 3, 4, 5].map((v) => {
          const y = pt + (1 - (v - min) / (max - min)) * ih;
          return (
            <g key={v}>
              <line x1={pl} x2={w - pr} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x="6" y={y + 4} fill="var(--muted)" fontSize="11" className="font-mono">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />

        {coords.map((c, i) => {
          const selected = activeIndex === i;
          return (
            <g
              key={`${c.label}-${i}`}
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(selected ? null : i)}
            >
              <circle cx={c.x} cy={c.y} r="14" fill="transparent" />
              <circle
                cx={c.x}
                cy={c.y}
                r={selected ? "5.5" : "3.8"}
                fill="var(--primary)"
                stroke={selected ? "var(--surface)" : "none"}
                strokeWidth={selected ? "2" : "0"}
              />
              <text x={c.x} y={h - 10} textAnchor="middle" fill="var(--muted)" fontSize="11">
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs text-muted">
        Horizontal axis: date. Vertical axis: stored NCC_DSA rating (1.00–5.00).
      </figcaption>
    </figure>
  );
}
