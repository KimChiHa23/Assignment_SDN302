"use client";

import { useState } from "react";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { TaskItem } from "@/types/task";

interface TaskFormProps {
  onTaskCreated: (newTask: TaskItem) => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation: bắt buộc title
    if (!title.trim()) {
      setError("Task title is required!");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create task");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setStatus("To Do");
      setPriority("Medium");
      setDueDate("");
      setIsExpanded(false);

      // Cập nhật UI ngay lập tức
      onTaskCreated(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while creating task";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-purple-100 bg-white/95 p-6 shadow-sm shadow-purple-100/50 transition-all dark:border-purple-900/60 dark:bg-[#181328] dark:shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/80 dark:text-purple-300">
            <PlusCircle className="h-4.5 w-4.5" />
          </div>
          Create New Task
        </h2>
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
          >
            Show full form
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-sm text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input (Required) */}
        <div>
          <label htmlFor="task-title" className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            placeholder="e.g. Design homepage wireframe..."
            value={title}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/20 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:placeholder:text-purple-300/40 dark:focus:border-purple-400 dark:focus:bg-[#261d42]"
          />
        </div>

        {/* Expandable options */}
        {isExpanded && (
          <>
            {/* Description Input */}
            <div>
              <label htmlFor="task-desc" className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
                Description (Optional)
              </label>
              <textarea
                id="task-desc"
                rows={3}
                placeholder="Add details, criteria or sub-tasks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/20 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:placeholder:text-purple-300/40 dark:focus:border-purple-400 dark:focus:bg-[#261d42]"
              />
            </div>

            {/* Grid options: Status, Priority, Due Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Status */}
              <div>
                <label htmlFor="task-status" className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
                  Status
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/20 px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:focus:bg-[#261d42]"
                >
                  <option value="To Do" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">To Do</option>
                  <option value="In Progress" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">In Progress</option>
                  <option value="Done" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="task-priority" className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/20 px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:focus:bg-[#261d42]"
                >
                  <option value="Low" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">Low</option>
                  <option value="Medium" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">Medium</option>
                  <option value="High" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">High</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="task-duedate" className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
                  Due Date
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="task-duedate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full rounded-2xl border border-purple-200 bg-purple-50/20 px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:focus:bg-[#261d42] [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/60"
            >
              Collapse
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/30 transition-all hover:bg-purple-500 active:bg-purple-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                <span>Add Task</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
