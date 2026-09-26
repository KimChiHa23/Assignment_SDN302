"use client";

import { useState } from "react";
import { Edit3, Trash2, Calendar, Clock, AlertCircle, CheckCircle2, CircleDashed, Search } from "lucide-react";
import { TaskItem } from "@/types/task";

interface TaskListProps {
  tasks: TaskItem[];
  isLoading: boolean;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onStatusChange?: (task: TaskItem, newStatus: string) => void;
}

export default function TaskList({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      (task.description && task.description.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Done":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
            <CircleDashed className="h-3.5 w-3.5 animate-spin" />
            In Progress
          </span>
        );
      case "To Do":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" />
            To Do
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return (
          <span className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            High
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Low
          </span>
        );
      case "Medium":
      default:
        return (
          <span className="inline-flex items-center rounded-lg bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            Medium
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-purple-100 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-hidden focus:ring-3 focus:ring-purple-300/25 dark:border-purple-900/50 dark:bg-[#181428] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <div className="text-xs font-medium text-purple-900/60 dark:text-purple-300/70">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Task Table / Cards */}
      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-purple-200/80 bg-white/70 dark:border-purple-900/60 dark:bg-[#181428]/70">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Loading tasks...
            </p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-purple-200 bg-white/70 p-8 text-center dark:border-purple-900/60 dark:bg-[#181428]/70">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-500 dark:bg-purple-950 dark:text-purple-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery ? "No matching tasks found" : "No tasks available"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {searchQuery
              ? "Try adjusting your search criteria."
              : "Get started by creating your first task above!"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white/95 shadow-sm shadow-purple-100/50 dark:border-purple-950/60 dark:bg-[#181428] dark:shadow-none">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:border-purple-950/60 dark:bg-purple-950/30 dark:text-purple-300/80">
                  <th className="py-3.5 px-6">Task</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50/80 text-sm dark:divide-purple-950/40">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group transition-colors hover:bg-purple-50/40 dark:hover:bg-purple-950/20"
                  >
                    {/* Task Title & Description */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {onStatusChange ? (
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task, e.target.value)}
                          className="rounded-xl border border-transparent bg-transparent py-1 px-2.5 text-xs font-medium text-slate-700 hover:border-purple-200 focus:border-purple-400 focus:bg-white dark:text-slate-300 dark:hover:border-purple-800"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      ) : (
                        getStatusBadge(task.status)
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {task.dueDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-purple-400" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(task)}
                          className="flex items-center gap-1 rounded-xl border border-purple-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-900/60 dark:bg-[#1a162b] dark:text-slate-300 dark:hover:bg-purple-950"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-purple-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(task)}
                          className="flex items-center gap-1 rounded-xl border border-rose-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-950/60 dark:bg-[#1a162b] dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-purple-50 dark:divide-purple-950/40 md:hidden">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3 w-3 text-purple-400" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-50 dark:border-purple-950/40">
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="flex items-center gap-1 rounded-xl border border-purple-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-purple-50 dark:border-purple-900/60 dark:text-slate-300"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-purple-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(task)}
                    className="flex items-center gap-1 rounded-xl border border-rose-100 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-950/60 dark:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
