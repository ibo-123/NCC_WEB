import { cx } from "./cx.js";

/** Surface container. `flat` drops the shadow; `important` adds the warning accent. */
export function Card({ as: Tag = "div", flat = false, important = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-xl border border-border bg-card p-5",
        !flat && "shadow-card",
        important && "border-l-[3px] border-l-warning",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Label / value / hint block used on dashboards. */
export function Stat({ label, value, hint, trend }) {
  const hintTone = trend === "up" ? "text-up" : trend === "down" ? "text-down" : "text-fg-2";
  return (
    <Card>
      <div className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</div>
      <div className="mt-2 text-[32px] leading-[1.1] font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? <div className={cx("mt-1.5 text-[13px]", hintTone)}>{hint}</div> : null}
    </Card>
  );
}
