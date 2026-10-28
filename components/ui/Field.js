import { useId } from "react";
import { cx } from "./cx.js";

const CONTROL =
  "w-full min-h-10 rounded-lg border bg-surface px-3 py-2 text-fg " +
  "focus:border-primary focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none " +
  "disabled:bg-sunken disabled:text-muted";

/**
 * Labelled form control with hint, error and success messages.
 * `as`: "input" (default), "textarea" or "select" (pass <option> children).
 * The label is always associated with the control; an error sets aria-invalid and is announced.
 */
export function Field({ label, as = "input", error, hint, success, className, children, id: idProp, ...rest }) {
  const generated = useId();
  const id = idProp ?? generated;
  const messageId = `${id}-msg`;
  const message = error ?? success ?? hint;
  const Control = as;
  if (!["input", "textarea", "select"].includes(as)) throw new TypeError(`Unsupported Field control "${as}"`);

  const tone = error ? "text-error" : success ? "text-up" : "text-fg-2";
  const border = error ? "border-error" : success ? "border-solid-success" : "border-border-strong";
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      <Control
        id={id}
        className={cx(CONTROL, as === "textarea" && "min-h-[120px] resize-y", border)}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      >
        {as === "select" ? children : undefined}
      </Control>
      {message ? (
        <p id={messageId} role={error ? "alert" : undefined} className={cx("text-xs", tone)}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
