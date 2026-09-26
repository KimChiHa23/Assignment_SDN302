"use client";

import { useState } from "react";
import { X, Loader2, Save, AlertCircle } from "lucide-react";
import { TaskItem } from "@/types/task";

interface TaskModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskItem) => void;
}

function TaskEditForm({
  task,
  onClose,
  onTaskUpdated,
}: {
  task: TaskItem;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskItem) => void;
}) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status || "To Do");
  const [priority, setPriority] = useState(task.priority || "Medium");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required!");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update task");
      }

      onTaskUpdated(result.data);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while updating task";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-sm text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Task Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
          Task Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:placeholder:text-purple-300/40 dark:focus:border-purple-400 dark:focus:bg-[#261d42]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task details..."
          className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-300/30 dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:placeholder:text-purple-300/40 dark:focus:border-purple-400 dark:focus:bg-[#261d42]"
        />
      </div>

      {/* Options: Status, Priority, Due Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:bg-white dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:focus:bg-[#261d42]"
          >
            <option value="To Do" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">To Do</option>
            <option value="In Progress" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">In Progress</option>
            <option value="Done" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">Done</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:bg-white dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:focus:bg-[#261d42]"
          >
            <option value="Low" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">Low</option>
            <option value="Medium" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">Medium</option>
            <option value="High" className="bg-white text-slate-900 dark:bg-[#1a142c] dark:text-white">High</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-900/70 dark:text-purple-200">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1.5 block w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:bg-white dark:border-purple-800/80 dark:bg-[#201836] dark:text-white dark:focus:bg-[#261d42] [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100 dark:border-purple-900/50">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-200 dark:hover:bg-purple-950/60 dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/30 transition-all hover:bg-purple-500 active:bg-purple-700 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function TaskModal({
  isOpen,
  task,
  onClose,
  onTaskUpdated,
}: TaskModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl dark:border-purple-900/70 dark:bg-[#181328]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-4 dark:border-purple-900/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/60 dark:hover:text-purple-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Form with key to reset state */}
        <TaskEditForm
          key={task.id}
          task={task}
          onClose={onClose}
          onTaskUpdated={onTaskUpdated}
        />
      </div>
    </div>
  );
}
