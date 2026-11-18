import { cx } from "./cx.js";

/**
 * Open board section (not a boxed card).
 * Hairline accent rule on top; `important` adds a left clock accent.
 */
export function Card({ as: Tag = "div", flat = false, important = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "relative bg-transparent p-0 shadow-none",
        !important && "before:mb-4 before:block before:h-0.5 before:w-9 before:bg-primary",
        flat && "before:mb-3 before:w-6 before:opacity-70",
        important && "border-l-2 border-l-[var(--clock)] pl-4 before:hidden",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Label / value / hint block used on dashboards — open section, not a card. */
export function Stat({ label, value, hint, trend }) {
  const hintTone = trend === "up" ? "text-up" : trend === "down" ? "text-down" : "text-fg-2";
  return (
    <Card>
      <div className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{label}</div>
      <div className="mt-2 font-mono text-[34px] leading-[1.05] font-bold tracking-tight text-[var(--rank)] tabular-nums">{value}</div>
      {hint ? <div className={cx("mt-1.5 font-mono text-[13px]", hintTone)}>{hint}</div> : null}
    </Card>
  );
}
