import type { EventSummary } from "@/lib/types";

interface RecentEventsProps {
  events: EventSummary[];
}

export default function RecentEvents({ events }: RecentEventsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Recent Events
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
          Last 5 events
        </h2>
      </div>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No recent events found.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {events.slice(0, 5).map((event) => (
                <tr key={`${event.title}-${event.date}`}>
                  <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                    {event.title}
                  </td>
                  <td className="px-3 py-3">
                    {new Date(event.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(event.status)}`}
                    >
                      {event.status ?? "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getStatusClasses(status?: string) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "attended":
    case "active":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "cancelled":
    case "absent":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200";
    case "upcoming":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}
