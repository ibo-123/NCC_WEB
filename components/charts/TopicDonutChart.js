"use client";

/**
 * Segmented donut ring chart inspired by the Spending donut in the design reference.
 * segments: [{ label, value, color }]
 */
export function TopicDonutChart({ segments = [], centerValue, centerLabel }) {
  const total = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0) || 1;
  const size = 148;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const portion = Math.max(0, seg.value) / total;
    const rawLen = portion * circumference;
    const dashLen = Math.max(0, rawLen - gap);
    const arc = {
      ...seg,
      dashArray: `${dashLen.toFixed(2)} ${(circumference - dashLen).toFixed(2)}`,
      dashOffset: (-offset).toFixed(2),
    };
    offset += rawLen;
    return arc;
  });

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative grid size-[148px] flex-none place-items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--sunken)"
            strokeWidth={stroke}
          />
          {arcs.map((arc, idx) => (
            <circle
              key={`${arc.label}-${idx}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-semibold tracking-tight tabular-nums text-fg">{centerValue}</span>
          {centerLabel ? <span className="text-[11px] text-muted">{centerLabel}</span> : null}
        </div>
      </div>

      <ul className="m-0 flex min-w-[160px] flex-1 list-none flex-col gap-2 p-0 text-xs">
        {segments.map((seg, idx) => (
          <li key={`${seg.label}-${idx}`} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-fg-2">
              <span
                aria-hidden="true"
                className="block size-2 rounded-full"
                style={{ background: seg.color }}
              />
              <span>{seg.label}</span>
            </span>
            <span className="font-mono font-semibold text-fg tabular-nums">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
