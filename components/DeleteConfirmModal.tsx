"use client";

import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title = "Confirm Delete",
  itemName,
  description = "This action cannot be undone and data will be permanently deleted.",
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl dark:border-rose-950 dark:bg-[#181428] sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Please confirm before proceeding
            </p>
          </div>
        </div>

        {itemName && (
          <div className="my-4 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-[#141022]">
            <p className="text-xs font-semibold text-slate-900 break-words dark:text-white">
              &quot;{itemName}&quot;
            </p>
          </div>
        )}

        <p className="text-xs text-rose-600 dark:text-rose-400">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/25 transition hover:bg-rose-700 disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
