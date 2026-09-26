import Link from "next/link";
import { Users, Sparkles, ArrowLeft, Shield, UserPlus } from "lucide-react";

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-4 py-1.5 text-xs font-semibold text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-purple-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Feature In Development</span>
        </div>

        {/* Icon & Title */}
        <div className="mt-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-500 to-violet-400 text-white shadow-xl shadow-purple-400/30">
            <Users className="h-10 w-10" />
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Team Management
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          The collaborative team feature is currently being crafted for Assignment 2. You will be able to create teams, invite members, assign roles (Admin/Member), and collaborate seamlessly!
        </p>

        {/* Feature previews */}
        <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm shadow-purple-100/40 dark:border-purple-950/60 dark:bg-[#181428]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Member Invitations
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Invite teammates via email and collaborate across shared project boards.
            </p>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm shadow-purple-100/40 dark:border-purple-950/60 dark:bg-[#181428]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Role-Based Access
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Granular permissions with ADMIN and MEMBER roles defined in Prisma schema.
            </p>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-300/40 transition-all hover:bg-purple-600 active:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Task Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
