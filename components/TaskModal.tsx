"use client";

import { useState } from "react";
import { X, CheckSquare, AlertCircle, Save, Calendar, User, Flag, Clock } from "lucide-react";
import { TaskItem } from "@/types/task";
import { TeamMemberItem } from "@/types/team";

interface TaskModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  teamId: string;
  teamMembers?: TeamMemberItem[];
  task?: TaskItem | null;
  onClose: () => void;
  onSuccess: (task: TaskItem) => void;
}

function TaskModalDialog({
  mode,
  teamId,
  teamMembers = [],
  task,
  onClose,
  onSuccess,
}: TaskModalProps) {
  const [title, setTitle] = useState(
    mode === "edit" && task ? task.title || "" : ""
  );
  const [description, setDescription] = useState(
    mode === "edit" && task ? task.description || "" : ""
  );
  const [status, setStatus] = useState(
    mode === "edit" && task ? task.status || "To Do" : "To Do"
  );
  const [priority, setPriority] = useState(
    mode === "edit" && task ? task.priority || "Medium" : "Medium"
  );
  const [dueDate, setDueDate] = useState(
    mode === "edit" && task && task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [assigneeId, setAssigneeId] = useState(
    mode === "edit" && task ? task.assigneeId || "" : ""
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const url =
        mode === "create"
          ? `/api/teams/${teamId}/tasks`
          : `/api/tasks/${task?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Operation failed");
      }

      onSuccess(data.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl dark:border-purple-950 dark:bg-[#181428] sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === "create" ? "Create New Task" : "Edit Task"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === "create"
                  ? "Any team member can create tasks"
                  : "Update progress, priority, or assignee"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design Database & Auth API"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#1c162e] dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed requirements, references, notes..."
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#1c162e] dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Row 2: Status & Priority */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#1c162e] dark:text-white"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                <Flag className="h-3.5 w-3.5 text-slate-400" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#1c162e] dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Row 3: Due Date & Assignee */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#1c162e] dark:text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Assignee</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#1c162e] dark:text-white"
              >
                <option value="">-- Unassigned --</option>
                {teamMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name} ({member.user.email}) - {member.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/25 transition hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{mode === "create" ? "Create Task" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TaskModal(props: TaskModalProps) {
  if (!props.isOpen) return null;
  return (
    <TaskModalDialog
      key={`${props.mode}-${props.task?.id || "new"}`}
      {...props}
    />
  );
}
