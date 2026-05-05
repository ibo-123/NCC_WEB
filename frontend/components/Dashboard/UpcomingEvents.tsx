import type { EventSummary } from "@/lib/types";

interface UpcomingEventsProps {
  events: EventSummary[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Upcoming Events
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
          Next 3 events
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        {events.slice(0, 3).map((event) => (
          <div
            key={`${event.title}-${event.date}`}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {event.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {event.type ?? "Event"}
                </p>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(event.date).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span>{getCountdown(event.date)} remaining</span>
              <span className={getStatusClasses(event.status)}>
                {event.status ?? "Planned"}
              </span>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No upcoming events at the moment.
          </p>
        )}
      </div>
    </div>
  );
}

function getCountdown(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.max(0, date.getTime() - now.getTime());
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function getStatusClasses(status?: string) {
  return status?.toLowerCase() === "cancelled"
    ? "inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-200"
    : "inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200";
}
