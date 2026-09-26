"use client";

import { TaskStatus } from "@/types/task";

interface StatusFilterProps {
  currentStatus: TaskStatus;
  onSelectStatus: (status: TaskStatus) => void;
  counts: {
    all: number;
    todo: number;
    inProgress: number;
    done: number;
  };
}

export default function StatusFilter({
  currentStatus,
  onSelectStatus,
  counts,
}: StatusFilterProps) {
  const filters: { label: string; value: TaskStatus; count: number }[] = [
    { label: "All Tasks", value: "All", count: counts.all },
    { label: "To Do", value: "To Do", count: counts.todo },
    { label: "In Progress", value: "In Progress", count: counts.inProgress },
    { label: "Done", value: "Done", count: counts.done },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const isActive = currentStatus === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onSelectStatus(f.value)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-purple-500 text-white shadow-md shadow-purple-300/40 dark:bg-purple-600 dark:shadow-purple-950/50"
                : "border border-purple-100/80 bg-white/90 text-slate-600 hover:border-purple-200 hover:bg-purple-50/60 hover:text-purple-700 dark:border-purple-900/50 dark:bg-[#19152b] dark:text-slate-300 dark:hover:bg-purple-950/50 dark:hover:text-purple-300"
            }`}
          >
            <span>{f.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isActive
                  ? "bg-white/25 text-white"
                  : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              }`}
            >
              {f.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
