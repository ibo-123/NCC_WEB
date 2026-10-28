import { cx } from "./cx.js";

// Status tones. The prototype classes map as follows:
//   success: published, solved, active-account, ok     info: active, info
//   warning: upcoming, pending, warning                danger: failed, restricted, live
// draft, completed, unsolved and neutral were missing in the prototype; their styles below are
// PROPOSED and need design review.
export const BADGE_TONES = {
  neutral: "bg-sunken text-fg-2",
  success: "bg-success-soft text-up",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  danger: "bg-error-soft text-error",
  draft: "bg-sunken text-muted border border-dashed border-border-strong",
  completed: "bg-sunken text-fg-2 border border-border-strong",
  unsolved: "bg-transparent text-fg-2 border border-border-strong",
};

export function Badge({ tone = "neutral", dot = false, className, children }) {
  if (!Object.hasOwn(BADGE_TONES, tone)) throw new TypeError(`Unknown badge tone "${tone}"`);
  return (
    <span
      className={cx(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2 text-xs font-semibold whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot ? <i aria-hidden="true" className="block size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
