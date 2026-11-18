import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cx } from "./cx.js";

/**
 * Surface container.
 * `flat` drops the shadow; `important` highlights attention;
 * `lime` renders the brand spotlight card (sky / navy — legacy prop name).
 */
export function Card({ as: Tag = "div", flat = false, important = false, lime = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border p-5 transition-colors duration-150",
        lime ? "border-transparent bg-lime-card text-lime-card-fg" : "border-border bg-card",
        !flat && "shadow-card",
        important && !lime && "border-warning/45 bg-warning-soft/25",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** KPI card: kicker, optional circular action link, tabular metric, and trend hint. */
export function Stat({ label, value, hint, trend, href, icon: Icon }) {
  const hintTone = trend === "up" ? "text-up" : trend === "down" ? "text-down" : "text-fg-2";
  return (
    <Card className="flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">
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
        <div className="font-mono text-[30px] leading-[1.08] font-semibold tracking-tight text-[var(--rank)] tabular-nums">
          {value}
        </div>
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
    </Card>
  );
}
