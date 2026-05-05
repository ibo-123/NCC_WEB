import type { SummaryItem } from "@/lib/types";

interface AchievementsListProps {
  achievements: SummaryItem[];
}

export default function AchievementsList({
  achievements,
}: AchievementsListProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Recent Achievements
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
            Latest 5
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {achievements.length}
        </span>
      </div>

      {achievements.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No achievements available yet.
        </p>
      ) : (
        <div className="mt-6 space-y-4 max-h-[340px] overflow-y-auto pr-2">
          {achievements.slice(0, 5).map((achievement) => (
            <div
              key={`${achievement.title}-${achievement.date}`}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-semibold text-slate-900 dark:text-white">
                {achievement.title}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {achievement.category}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {new Date(achievement.date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
