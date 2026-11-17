"use client";

import { useId, useState } from "react";

/**
 * Vertical hatched bar chart inspired by the design reference:
 * diagonal hatched dark bars with electric-lime top cap lines, and solid lime highlight for the active bar.
 * items: [{ label, value, detail? }]
 */
export function WeeklyBarChart({ items = [], unit = "", maxValue }) {
  const patternId = useId();
  const [selectedIndex, setSelectedIndex] = useState(
    items.length > 0 ? Math.max(0, items.length - 1) : 0,
  );

  if (!items.length) return null;

  const peak = maxValue ?? Math.max(...items.map((d) => d.value), 1);
  const w = 640;
  const h = 210;
  const pl = 30;
  const pr = 14;
  const pt = 28;
  const pb = 30;
  const ih = h - pt - pb;
  const iw = w - pl - pr;
  const slotW = iw / items.length;
  const barW = Math.min(34, Math.max(16, slotW * 0.54));

  const active = items[selectedIndex] ?? items[items.length - 1];

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Click or hover any bar to inspect</span>
        {active ? (
          <span className="rounded-md bg-primary-soft px-2 py-0.5 font-mono font-semibold text-primary tabular-nums">
            {active.label}: {active.value}
            {unit}
            {active.detail ? ` · ${active.detail}` : ""}
          </span>
        ) : null}
      </div>

      <svg
        className="block h-auto w-full"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Bar chart"
      >
        <defs>
          <pattern id={patternId} width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="var(--sunken)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border-strong)" strokeWidth="2" />
          </pattern>
        </defs>

        {[0, 0.5, 1].map((ratio) => {
          const y = pt + (1 - ratio) * ih;
          const labelVal = Math.round(peak * ratio);
          return (
            <g key={ratio}>
              <line x1={pl} x2={w - pr} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" strokeWidth="1" />
              <text x="2" y={y + 4} fill="var(--muted)" fontSize="10" className="font-mono">
                {labelVal}
              </text>
            </g>
          );
        })}

        {items.map((item, i) => {
          const ratio = Math.max(0.06, Math.min(1, item.value / peak));
          const bh = ratio * ih;
          const x = pl + i * slotW + (slotW - barW) / 2;
          const y = pt + ih - bh;
          const isSelected = i === selectedIndex;

          return (
            <g
              key={`${item.label}-${i}`}
              className="cursor-pointer"
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => setSelectedIndex(i)}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx="6"
                fill={isSelected ? "var(--primary)" : `url(#${patternId})`}
                stroke={isSelected ? "var(--primary)" : "var(--border-strong)"}
                strokeWidth="1"
              />
              {!isSelected ? (
                <rect
                  x={x + 4}
                  y={y + 3}
                  width={Math.max(4, barW - 8)}
                  height="3"
                  rx="1.5"
                  fill="var(--primary)"
                />
              ) : (
                <g>
                  <rect
                    x={x + barW / 2 - 22}
                    y={Math.max(2, y - 22)}
                    width="44"
                    height="17"
                    rx="8.5"
                    fill="var(--primary)"
                  />
                  <text
                    x={x + barW / 2}
                    y={Math.max(13.5, y - 10.5)}
                    textAnchor="middle"
                    fill="var(--primary-text)"
                    fontSize="10"
                    fontWeight="700"
                    className="font-mono"
                  >
                    {item.value}
                    {unit}
                  </text>
                </g>
              )}
              <text
                x={x + barW / 2}
                y={h - 8}
                textAnchor="middle"
                fill={isSelected ? "var(--text)" : "var(--muted)"}
                fontSize="11"
                fontWeight={isSelected ? "600" : "400"}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
