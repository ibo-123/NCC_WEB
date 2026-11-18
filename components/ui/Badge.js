import { cx } from "./cx.js";

export const BADGE_TONES = {
  neutral: "bg-sunken text-fg-2 border border-border",
  success: "bg-success-soft text-up border border-success/25",
  info: "bg-info-soft text-info border border-info/25",
  warning: "bg-warning-soft text-warning border border-warning/25",
  danger: "bg-error-soft text-error border border-error/25",
  draft: "bg-sunken text-muted border border-dashed border-border-strong",
  completed: "bg-sunken text-fg-2 border border-border-strong",
  unsolved: "bg-transparent text-fg-2 border border-border-strong",
};

export function Badge({ tone = "neutral", dot = false, className, children }) {
  if (!Object.hasOwn(BADGE_TONES, tone)) throw new TypeError(`Unknown badge tone "${tone}"`);
  return (
    <span
      className={cx(
        "inline-flex min-h-6 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] font-bold tracking-wide uppercase whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot ? <i aria-hidden="true" className="block size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
