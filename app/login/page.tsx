import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign In to TaskFlow
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Authentication is planned for future iterations. For Assignment 1, tasks are managed
            publicly without sign-in requirements.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Email Address
            </label>
            <input
              type="email"
              disabled
              placeholder="demo@example.com"
              className="mt-1 block w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500 opacity-70 dark:border-slate-800 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Password
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="mt-1 block w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500 opacity-70 dark:border-slate-800 dark:bg-slate-800"
            />
          </div>

          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-indigo-600/50 py-2.5 text-sm font-semibold text-white"
          >
            Coming in Assignment 2
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
