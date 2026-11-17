<<<<<<< HEAD
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cx } from "./cx.js";

/** Surface container. `flat` drops the shadow; `important` highlights attention; `lime` renders the electric-lime spotlight card. */
export function Card({ as: Tag = "div", flat = false, important = false, lime = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border p-5 transition-colors duration-150",
        lime
          ? "border-transparent bg-lime-card text-lime-card-fg"
          : "border-border bg-card",
        !flat && "shadow-card",
        important && !lime && "border-warning/45 bg-warning-soft/25",
=======
import { cx } from "./cx.js";

/** Surface container. `flat` drops the shadow; `important` adds the warning accent. */
export function Card({ as: Tag = "div", flat = false, important = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-xl border border-border bg-card p-5",
        !flat && "shadow-card",
        important && "border-l-[3px] border-l-warning",
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

<<<<<<< HEAD
/** KPI card matching the reference bento stat layout: kicker, optional circular lime action link, tabular metric, and trend hint. */
export function Stat({ label, value, hint, trend, href, icon: Icon }) {
  const hintTone = trend === "up" ? "text-up" : trend === "down" ? "text-down" : "text-fg-2";
  return (
    <Card className="flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
          {Icon ? <Icon aria-hidden="true" size={13} className="text-muted" /> : null}
          <span>{label}</span>
        </div>
        {href ? (
          <Link
            href={href}
            aria-label={`Open ${label}`}
            className="grid size-7 flex-none place-items-center rounded-full bg-primary text-primary-text transition-transform duration-150 hover:scale-105"
          >
            <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-2.5">
        <div className="text-[30px] leading-[1.08] font-semibold tracking-tight tabular-nums">{value}</div>
        {hint ? (
          <div
            className={cx(
              "inline-flex items-center gap-1 text-xs font-medium",
              trend ? "rounded-md bg-sunken px-2 py-0.5 font-mono tabular-nums" : "",
              hintTone,
            )}
          >
            {trend === "up" ? <span aria-hidden="true">▲</span> : null}
            {trend === "down" ? <span aria-hidden="true">▼</span> : null}
            <span>{hint}</span>
          </div>
        ) : null}
      </div>
=======
/** Label / value / hint block used on dashboards. */
export function Stat({ label, value, hint, trend }) {
  const hintTone = trend === "up" ? "text-up" : trend === "down" ? "text-down" : "text-fg-2";
  return (
    <Card>
      <div className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</div>
      <div className="mt-2 text-[32px] leading-[1.1] font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? <div className={cx("mt-1.5 text-[13px]", hintTone)}>{hint}</div> : null}
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
    </Card>
  );
}
