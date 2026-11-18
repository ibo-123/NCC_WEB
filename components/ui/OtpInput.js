"use client";

import { useRef } from "react";
import { cx } from "./cx.js";

/**
 * Multi-box numeric OTP / attendance code input (4 or 6 digits).
 * Supports single-digit typing, paste, arrow keys, and backspace.
 */
export function OtpInput({ length = 4, value = "", onChange, label = "Code", disabled = false, error = false }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function commit(nextDigits) {
    onChange?.(nextDigits.join(""));
  }

  function handleChange(index, raw) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      commit(next);
      return;
    }
    const next = [...digits];
    let cursor = index;
    for (const ch of cleaned) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor += 1;
    }
    commit(next);
    const focusIdx = Math.min(cursor, length - 1);
    inputsRef.current[focusIdx]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        commit(next);
        inputsRef.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, i) => pasted[i] ?? "");
    commit(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={d}
          disabled={disabled}
          aria-label={`${label} digit ${i + 1}`}
          aria-invalid={error ? true : undefined}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cx(
            "h-14 w-12 rounded-[3px] border bg-surface text-center font-mono text-[22px] text-fg tabular-nums",
            "max-[420px]:h-[52px] max-[420px]:w-11",
            "focus:border-primary focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none",
            "disabled:bg-sunken disabled:text-muted",
            error ? "border-error" : "border-border-strong",
          )}
        />
      ))}
    </div>
  );
}
