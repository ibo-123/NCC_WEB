import { cx } from "./cx.js";

export function ProgressBar({ value = 0, label = "Progress" }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full border border-border bg-sunken"
    >
      <span
        className={cx("block h-full rounded-full bg-primary transition-[width] duration-200")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
