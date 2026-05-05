import type { DashboardUserProfile } from "@/lib/types";
import { User } from "lucide-react";

interface UserProfileCardProps {
  profile: DashboardUserProfile | null;
}

export default function UserProfileCard({ profile }: UserProfileCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Profile Summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {profile?.name ?? "Student Profile"}
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            User details are pulled from your dashboard profile and kept in sync
            with the API.
          </p>
        </div>
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-sm shadow-blue-500/20">
          <User className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Detail label="Email" value={profile?.email ?? "—"} />
        <Detail label="Student ID" value={profile?.studentId ?? "—"} />
        <Detail label="Department" value={profile?.department ?? "—"} />
        <Detail label="Year" value={profile?.year ?? "—"} />
        <Detail label="Role" value={profile?.role ?? "—"} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
