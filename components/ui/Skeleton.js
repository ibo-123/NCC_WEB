import { cx } from "./cx.js";

export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cx("h-3.5 animate-pulse rounded-[2px] bg-border", className)}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading content">
      <Skeleton className="h-7 w-2/5" />
      <div className="grid grid-cols-1 gap-4 min-[800px]:grid-cols-3">
        <Skeleton className="h-32 rounded-[3px]" />
        <Skeleton className="h-32 rounded-[3px]" />
        <Skeleton className="h-32 rounded-[3px]" />
      </div>
      <div className="grid grid-cols-1 gap-4 min-[800px]:grid-cols-2">
        <Skeleton className="h-48 rounded-[3px]" />
        <Skeleton className="h-48 rounded-[3px]" />
      </div>
    </div>
  );
}
