import Link from "next/link";
import { cx } from "./cx.js";

const BASE =
<<<<<<< HEAD
  "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold whitespace-nowrap shrink-0 no-underline cursor-pointer transition-colors duration-150 " +
=======
  "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold whitespace-nowrap no-underline cursor-pointer " +
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
  "disabled:opacity-45 disabled:pointer-events-none aria-disabled:opacity-45 aria-disabled:pointer-events-none";

export const BUTTON_VARIANTS = {
  primary: "border-transparent bg-primary text-primary-text hover:bg-primary-hover",
<<<<<<< HEAD
  secondary: "border-border bg-secondary text-secondary-text hover:bg-sunken",
  outline: "border-border-strong bg-transparent text-fg hover:bg-sunken",
  ghost: "border-transparent bg-transparent text-fg-2 hover:bg-sunken hover:text-fg",
  danger: "border-transparent bg-solid-danger text-white hover:opacity-90",
  success: "border-transparent bg-solid-success text-white hover:opacity-90",
};

export const BUTTON_SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
=======
  secondary: "border-transparent bg-secondary text-secondary-text",
  outline: "border-border-strong bg-transparent text-fg hover:bg-sunken",
  ghost: "border-transparent bg-transparent text-fg-2 hover:bg-sunken hover:text-fg",
  danger: "border-transparent bg-solid-danger text-white",
  success: "border-transparent bg-solid-success text-white",
};

export const BUTTON_SIZES = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-10 px-3.5 text-sm",
  lg: "h-12 px-[18px] text-[15px]",
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
};

export function buttonClass({ variant = "primary", size = "md", block = false, className } = {}) {
  if (!Object.hasOwn(BUTTON_VARIANTS, variant)) throw new TypeError(`Unknown button variant "${variant}"`);
  if (!Object.hasOwn(BUTTON_SIZES, size)) throw new TypeError(`Unknown button size "${size}"`);
  return cx(BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], block && "w-full", className);
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 rounded-full border-2 border-current border-r-transparent"
      style={{ animation: "ncc-spin .7s linear infinite" }}
    />
  );
}

/** A <button>. `loading` disables it and shows a spinner; pass `onClick` or use inside a <form>. */
export function Button({ variant, size, block, loading = false, className, children, type = "button", disabled, ...rest }) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

/** A link styled as a button. `disabled` renders a non-interactive element. */
export function ButtonLink({ href, variant, size, block, className, disabled = false, children, ...rest }) {
  const classes = buttonClass({ variant, size, block, className });
  if (disabled) {
    return (
      <span className={classes} aria-disabled="true" {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
