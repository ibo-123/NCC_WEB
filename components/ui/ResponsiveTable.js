import { DataTable } from "./Table.js";
import { cx } from "./cx.js";

/**
 * Renders DataTable on >=800px screens and stacked mobile cards under 800px,
 * matching design-reference smartTable behavior.
 */
export function ResponsiveTable({ columns, rows, rowKey = (row) => row.id, highlight, empty = "Nothing to show.", caption }) {
  return (
    <>
      <div className="max-[799px]:hidden">
        <DataTable columns={columns} rows={rows} rowKey={rowKey} highlight={highlight} empty={empty} caption={caption} />
      </div>
      <div className="flex flex-col gap-2.5 min-[800px]:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted">
            {empty}
          </div>
        ) : (
          rows.map((row) => {
            const isHighlighted = highlight?.(row);
            return (
              <article
                key={rowKey(row)}
                className={cx(
                  "rounded-2xl border border-border bg-card px-4 py-3",
                  isHighlighted && "border-primary/50 bg-highlight",
                )}
              >
                {columns.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 py-1 text-sm">
                    <span className="text-xs font-semibold tracking-wider text-muted uppercase">{c.header}</span>
                    <div className={cx("text-right", c.align === "right" && "tabular-nums", c.className)}>
                      {c.render ? c.render(row) : row[c.key]}
                    </div>
                  </div>
                ))}
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
