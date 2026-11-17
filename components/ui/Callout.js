import { cx } from "./cx.js";

const TONES = {
  info: "border-info/35 bg-info-soft text-fg",
  warn: "border-warning/35 bg-warning-soft text-fg",
  danger: "border-error/35 bg-error-soft text-fg",
  ok: "border-success/35 bg-success-soft text-fg",
};

export function Callout({ tone = "info", title, role, className, children }) {
  return (
    <div
      role={role}
      className={cx(
        "rounded-xl border px-4 py-3 text-sm",
        TONES[tone] ?? TONES.info,
        className,
      )}
    >
      {title ? <strong className="mb-0.5 block font-semibold">{title}</strong> : null}
      <div className="text-fg-2">{children}</div>
    </div>
  );
}
