import { cx } from "./cx.js";

const TONES = {
  info: "border-info/35 border-l-info bg-info-soft text-fg",
  warn: "border-warning/35 border-l-warning bg-warning-soft text-fg",
  danger: "border-error/35 border-l-error bg-error-soft text-fg",
  ok: "border-success/35 border-l-success bg-success-soft text-fg",
};

export function Callout({ tone = "info", title, role, className, children }) {
  return (
    <div
      role={role}
      className={cx(
        "rounded-[2px] border border-l-[3px] px-4 py-3 text-sm",
        TONES[tone] ?? TONES.info,
        className,
      )}
    >
      {title ? <strong className="mb-0.5 block font-semibold">{title}</strong> : null}
      <div className="text-fg-2">{children}</div>
    </div>
  );
}
