"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Sparkles, CheckCircle2, Clock, CircleDashed, ListTodo, RefreshCw } from "lucide-react";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import StatusFilter from "@/components/StatusFilter";
import TaskModal from "@/components/TaskModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { TaskItem, TaskStatus } from "@/types/task";

export default function HomePage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<TaskStatus>("All");

  // Modal edit state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal delete state
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / notification feedback
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  }, []);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTasks(json.data);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
      showNotification("Could not load tasks from database. Please check connection.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialTasks() {
      try {
        const res = await fetch("/api/tasks");
        const json = await res.json();
        if (!ignore && json.success && Array.isArray(json.data)) {
          setTasks(json.data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading tasks:", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialTasks();

    return () => {
      ignore = true;
    };
  }, []);

  // Tính số lượng theo trạng thái
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "To Do").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      done: tasks.filter((t) => t.status === "Done").length,
    };
  }, [tasks]);

  // Tasks sau khi filter theo tab
  const displayedTasks = useMemo(() => {
    if (currentFilter === "All") return tasks;
    return tasks.filter((t) => t.status === currentFilter);
  }, [tasks, currentFilter]);

  // 1. Thêm mới task (cập nhật state ngay lập tức)
  const handleTaskCreated = (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
    showNotification("Task created successfully!");
  };

  // 2. Chỉnh sửa task (mở modal)
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // 2.1 Cập nhật task (state update tức thì)
  const handleTaskUpdated = (updatedTask: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    showNotification("Task updated successfully!");
  };

  // 3. Đổi nhanh trạng thái task từ danh sách
  const handleStatusChange = async (task: TaskItem, newStatus: string) => {
    // Optimistic update
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }
      showNotification(`Task marked as "${newStatus}"!`);
    } catch (err: unknown) {
      // Rollback
      setTasks(prevTasks);
      const message = err instanceof Error ? err.message : "Failed to change task status";
      showNotification(message, "error");
    }
  };

  // 4. Xóa task (mở modal xác nhận)
  const handleOpenDelete = (task: TaskItem) => {
    setDeletingTask(task);
    setIsDeleteModalOpen(true);
  };

  // 4.1 Thực hiện xóa task
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/tasks/${deletingTask.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setIsDeleteModalOpen(false);
      setDeletingTask(null);
      showNotification("Task deleted successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete task";
      showNotification(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-xl shadow-purple-900/10 transition-all animate-in slide-in-from-bottom-5 ${
            notification.type === "success"
              ? "bg-[#2d1b4e] text-purple-100 border border-purple-800/50"
              : "bg-rose-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4.5 w-4.5 text-purple-300" />
          ) : (
            <CircleDashed className="h-4.5 w-4.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-200/60 bg-gradient-to-br from-purple-700 via-violet-600 to-indigo-600 p-8 text-white shadow-xl shadow-purple-500/15 sm:p-12 dark:border-purple-900/50">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/40 bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-purple-200" />
            <span>SDN302 – Assignment 1 Full-Stack Project</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Task & Team Management App
          </h1>
          <p className="text-base text-purple-100/90 sm:text-lg">
            Streamline your workflow with a modern pastel aesthetic. Manage tasks with real-time updates, priorities, deadlines, and Supabase PostgreSQL integration.
          </p>
        </div>

        {/* Decorative background blur */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-fuchsia-400/25 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm shadow-purple-100/40 dark:border-purple-950/60 dark:bg-[#181428] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-900/60 dark:text-purple-300/70">Total Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{counts.all}</div>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm shadow-purple-100/40 dark:border-purple-950/60 dark:bg-[#181428] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-400">To Do</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.todo}</div>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm shadow-purple-100/40 dark:border-purple-950/60 dark:bg-[#181428] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700/80 dark:text-purple-300">In Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-300">
              <CircleDashed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-600 dark:text-purple-300">{counts.inProgress}</div>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm shadow-purple-100/40 dark:border-purple-950/60 dark:bg-[#181428] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400">Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.done}</div>
        </div>
      </section>

      {/* Form Tạo Task */}
      <section>
        <TaskForm onTaskCreated={handleTaskCreated} />
      </section>

      {/* Task List & Filter Section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <StatusFilter
            currentStatus={currentFilter}
            onSelectStatus={setCurrentFilter}
            counts={counts}
          />
          <button
            type="button"
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center gap-1.5 self-start rounded-2xl border border-purple-100 bg-white/90 px-4 py-2 text-xs font-semibold text-purple-800 transition-all hover:border-purple-200 hover:bg-purple-50 dark:border-purple-900/60 dark:bg-[#181428] dark:text-purple-200 dark:hover:bg-purple-950"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <TaskList
          tasks={displayedTasks}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onStatusChange={handleStatusChange}
        />
      </section>

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        task={deletingTask}
        isDeleting={isDeleting}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTask(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
