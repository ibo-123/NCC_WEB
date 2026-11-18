"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cx } from "./cx.js";

/**
 * Accessible confirmation / form modal.
 * Centered on desktop, slides as a bottom sheet under 800px.
 */
export function Modal({ open, onClose, title, description, footer, maxWidth = "max-w-[480px]", children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 max-[799px]:items-end max-[799px]:p-0"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ncc-modal-title"
        className={cx(
          "w-full rounded-[3px] border border-border border-t-2 border-t-primary bg-surface p-6 shadow-card",
          "max-[799px]:max-h-[92vh] max-[799px]:overflow-auto max-[799px]:rounded-b-none",
          maxWidth,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="ncc-modal-title" className="m-0 text-xl font-semibold tracking-tight text-fg">
              {title}
            </h2>
            {description ? <p className="mt-2 text-sm text-fg-2">{description}</p> : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="grid size-9 flex-none cursor-pointer place-items-center rounded-[2px] text-muted hover:bg-sunken hover:text-fg"
            >
              <X aria-hidden="true" size={18} />
            </button>
          ) : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
