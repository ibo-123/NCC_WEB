"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cx } from "./cx.js";

const TONE_STYLES = {
  ok: "border-l-success",
  bad: "border-l-error",
  warn: "border-l-warning",
  info: "border-l-info",
};

const TONE_ICONS = {
  ok: { Icon: CheckCircle2, color: "text-up" },
  bad: { Icon: XCircle, color: "text-error" },
  warn: { Icon: AlertTriangle, color: "text-warning" },
  info: { Icon: Info, color: "text-info" },
};

export function ToastViewport({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex w-[min(360px,calc(100%-32px))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const tone = TONE_STYLES[t.tone] ? t.tone : "info";
        const { Icon, color } = TONE_ICONS[tone];
        return (
          <div
            key={t.id}
            role="status"
            className={cx(
              "flex items-start gap-2.5 rounded-[10px] border border-border border-l-[3px] bg-surface px-3.5 py-3 shadow-card",
              TONE_STYLES[tone],
            )}
          >
            <Icon aria-hidden="true" size={18} className={cx("mt-0.5 flex-none", color)} />
            <div className="min-w-0 flex-1">
              <strong className="block text-sm font-semibold text-fg">{t.title}</strong>
              {t.body ? <span className="mt-0.5 block text-[13px] text-fg-2">{t.body}</span> : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="grid size-7 flex-none cursor-pointer place-items-center rounded-md text-muted hover:bg-sunken hover:text-fg"
            >
              <X aria-hidden="true" size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
