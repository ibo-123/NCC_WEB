import Link from "next/link";
import { cx } from "./cx.js";

/**
 * Data table inside a horizontally scrolling container.
 * columns: [{ key, header, render?(row), align?: "left"|"right", className? }]
 * `highlight(row)` marks a row (for example the signed-in user).
 */
export function DataTable({ columns, rows, rowKey = (row) => row.id, highlight, empty = "Nothing to show.", caption }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full border-collapse">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cx(
                  "border-b border-border bg-sunken px-3.5 py-3 text-xs font-semibold tracking-wider text-muted uppercase",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3.5 py-12 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="group">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(
                      "border-b border-border px-3.5 py-3 align-middle group-last:border-b-0 group-hover:bg-sunken",
                      highlight?.(row) && "bg-highlight",
                      c.align === "right" && "text-right tabular-nums",
                      c.className,
                    )}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const PAGER_ITEM =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium no-underline";

/** Which page numbers to show: first, last, and a window around the current page, with gaps as null. */
export function pageWindow(page, totalPages, radius = 1) {
  const keep = new Set([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p += 1) if (p >= 1 && p <= totalPages) keep.add(p);
  const sorted = [...keep].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

/** Link-based pager (works without client JavaScript). `hrefFor(page)` returns the URL for a page. */
export function Pager({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;
  const link = "border-border-strong text-fg hover:bg-sunken";
  const off = "border-border text-muted opacity-45 pointer-events-none";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-muted">
        Page {page} of {totalPages}
      </p>
      <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} rel="prev" className={cx(PAGER_ITEM, link)}>
              Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={cx(PAGER_ITEM, off)}>
              Previous
            </span>
          )}
        </li>
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={cx(PAGER_ITEM, p === page ? "border-primary bg-primary-soft text-primary" : link)}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} rel="next" className={cx(PAGER_ITEM, link)}>
              Next
            </Link>
          ) : (
            <span aria-disabled="true" className={cx(PAGER_ITEM, off)}>
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
