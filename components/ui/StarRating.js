import { Star } from "lucide-react";

/**
 * 5-star fractional rating indicator using --star token.
 */
export function StarRating({ value }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const pct = (v / 5) * 100;
  return (
    <span className="relative inline-flex items-center" role="img" aria-label={`${v.toFixed(2)} out of 5`}>
      <span className="inline-flex gap-0.5 text-border-strong" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={16} className="fill-current" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 inline-flex gap-0.5 overflow-hidden text-star"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={16} className="flex-none fill-current" />
        ))}
      </span>
    </span>
  );
}
