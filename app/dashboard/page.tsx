"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TeamItem } from "@/types/team";
import { TaskItem } from "@/types/task";

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const [teamsRes, tasksRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/tasks"),
        ]);

        const [teamsData, tasksData] = await Promise.all([
          teamsRes.json(),
          tasksRes.json(),
        ]);

        if (teamsData.success) {
          setTeams(teamsData.data || []);
        }
        if (tasksData.success) {
          // Lọc các task được gán cho user hiện tại hoặc do user tạo
          const allTasks: TaskItem[] = tasksData.data || [];
          setMyTasks(allTasks);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const assignedToMe = myTasks.filter((t) => t.assigneeId === user?.id);
  const createdByMe = myTasks.filter((t) => t.creatorId === user?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <div className="rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 p-6 sm:p-8 dark:border-purple-950 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-indigo-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Sparkles className="h-3 w-3" />
              <span>Personal Dashboard</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Quick overview of all your teams and ongoing tasks.
            </p>
          </div>

          <Link
            href="/teams"
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/25 transition hover:bg-purple-700"
          >
            <Users className="h-4 w-4" />
            <span>View Teams</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
          <span className="text-xs font-bold text-slate-400 uppercase">Joined Teams</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {teams.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
          <span className="text-xs font-bold text-slate-400 uppercase">Assigned Tasks</span>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {assignedToMe.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
          <span className="text-xs font-bold text-slate-400 uppercase">Created Tasks</span>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {createdByMe.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Team Tasks</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {myTasks.length}
          </div>
        </div>
      </div>

      {/* 2 Columns: Teams & Assigned Tasks */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Your Teams */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your Teams
            </h2>
            <Link
              href="/teams"
              className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ) : teams.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You haven&apos;t joined any teams yet.
              </div>
            ) : (
              teams.slice(0, 4).map((t) => (
                <Link
                  key={t.id}
                  href={`/teams/${t.id}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-3.5 transition hover:border-purple-200 hover:bg-purple-50/40 dark:border-slate-800/80 dark:hover:bg-purple-950/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {t._count?.members || 1} members • {t._count?.tasks || 0} tasks
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                      t.currentUserRole === "OWNER"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    }`}
                  >
                    {t.currentUserRole || "MEMBER"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Tasks Assigned To Me */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tasks Assigned To You
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {assignedToMe.length} tasks
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ) : assignedToMe.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tasks currently assigned to you.
              </div>
            ) : (
              assignedToMe.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {task.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Priority: {task.priority}</span>
                      {task.dueDate && (
                        <span>
                          • Due: {new Date(task.dueDate).toLocaleDateString("en-US")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                      task.status === "Done"
                        ? "bg-emerald-100 text-emerald-800"
                        : task.status === "In Progress"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
