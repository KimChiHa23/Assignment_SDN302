"use client";

import Link from "next/link";
import {
  CheckSquare,
  Users,
  Shield,
  Lock,
  ArrowRight,
  Sparkles,
  Clock,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, teams, isLoading } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-900/20" />
      <div className="pointer-events-none absolute top-1/3 -right-40 -z-10 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-900/20" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/90 bg-purple-50/80 px-4 py-1.5 text-xs font-bold text-purple-700 shadow-xs dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Assignment 2 – Full-stack Next.js & PostgreSQL</span>
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Modern Platform for{" "}
            <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Team & Task Management
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            Streamline collaborative workflows with robust role-based access control: secure user authentication, team administration for Owners & Members, and an interactive Kanban-style task tracking board.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isLoading ? (
              <div className="h-12 w-48 animate-pulse rounded-2xl bg-purple-200/60 dark:bg-purple-900/40" />
            ) : user ? (
              <>
                <Link
                  href="/teams"
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-violet-700 hover:shadow-purple-500/35 active:scale-[0.99]"
                >
                  <Users className="h-4 w-4" />
                  <span>Go to My Teams ({teams.length})</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-[#181428] dark:text-slate-200"
                >
                  <Clock className="h-4 w-4" />
                  <span>Personal Dashboard</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-violet-700 hover:shadow-purple-500/35 active:scale-[0.99]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-[#181428] dark:text-slate-200"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Auth */}
          <div className="rounded-3xl border border-purple-100/90 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-lg dark:border-purple-950/60 dark:bg-[#181428]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Secure Authentication
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Bcryptjs password hashing, JWT sessions in HttpOnly cookies, and automatic route protection via Next.js Middleware.
            </p>
          </div>

          {/* Card 2: Team Collaboration */}
          <div className="rounded-3xl border border-purple-100/90 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-lg dark:border-purple-950/60 dark:bg-[#181428]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Team Collaboration
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Create teams with OWNER role, invite members by account email, and organize workspaces effortlessly.
            </p>
          </div>

          {/* Card 3: Role-based permissions */}
          <div className="rounded-3xl border border-purple-100/90 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-lg dark:border-purple-950/60 dark:bg-[#181428]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Role-Based Access Control
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Only Owners manage teams and membership. Strict task deletion rules protecting work integrity.
            </p>
          </div>

          {/* Card 4: Task Board */}
          <div className="rounded-3xl border border-purple-100/90 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-lg dark:border-purple-950/60 dark:bg-[#181428]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Intuitive Task Board
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Status tracking (To Do / In Progress / Done), priority levels, deadlines, assignees, and real-time filtering.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
