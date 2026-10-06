"use client";

import { useState } from "react";
import { X, UserPlus, AlertCircle, Mail, Send } from "lucide-react";
import { TeamMemberItem } from "@/types/team";

interface AddMemberModalProps {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onSuccess: (newMember: TeamMemberItem) => void;
}

export default function AddMemberModal({
  isOpen,
  teamId,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to add member");
      }

      onSuccess(data.data);
      setEmail("");
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
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl dark:border-purple-950 dark:bg-[#181428] sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Team Member
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New member will have the MEMBER role
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
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
              User Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-4 pl-10 text-sm text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#141022] dark:text-white"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              The user must already have a registered account on TaskFlow.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
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
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Add to Team</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
