"use client";

import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { TaskItem } from "@/types/task";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  task,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl dark:border-purple-900/70 dark:bg-[#181328]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Task</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-purple-200/80">
              Are you sure you want to delete this task?
            </p>
          </div>
        </div>

        <div className="my-4 rounded-2xl bg-purple-50/50 p-3.5 border border-purple-100 dark:border-purple-900/50 dark:bg-[#201836]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            &quot;{task.title}&quot;
          </p>
        </div>

        <p className="text-xs text-rose-600 dark:text-rose-400">
          This action cannot be undone and will permanently remove this task from the database.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-200 dark:hover:bg-purple-950/60 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
