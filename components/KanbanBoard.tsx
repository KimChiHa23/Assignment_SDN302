"use client";

import { useState } from "react";
import {
  Calendar,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ListTodo,
  Check,
} from "lucide-react";
import { TaskItem } from "@/types/task";
import { TeamRole } from "@/types/team";
import { AuthUser } from "@/types/auth";
import { canEditTask, canDeleteTask, Role } from "@/lib/rbac";

interface KanbanBoardProps {
  tasks: TaskItem[];
  currentUser: AuthUser | null;
  currentUserRole: TeamRole;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
}

const COLUMNS = [
  {
    id: "To Do",
    title: "To Do",
    icon: ListTodo,
    color: "from-blue-500 to-indigo-500",
    badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    border: "border-blue-100 dark:border-blue-950/40",
  },
  {
    id: "In Progress",
    title: "In Progress",
    icon: CircleDashed,
    color: "from-amber-500 to-orange-500",
    badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-950/40",
  },
  {
    id: "Done",
    title: "Done",
    icon: CheckCircle2,
    color: "from-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-950/40",
  },
];

export default function KanbanBoard({
  tasks,
  currentUser,
  currentUserRole,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Check RBAC before initiating move
    const canEdit = currentUser
      ? canEditTask(currentUserRole as Role, task, currentUser.id)
      : false;
    if (!canEdit) return;

    setUpdatingTaskId(taskId);
    try {
      await onStatusChange(taskId, targetStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleQuickMove = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await onStatusChange(taskId, newStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const Icon = col.icon;
        const isDragOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-3xl border transition-all duration-200 bg-slate-50/70 p-4 dark:bg-[#161226]/80 ${
              isDragOver
                ? "border-purple-500 bg-purple-50/40 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/20 dark:border-purple-600 dark:bg-purple-950/30"
                : `${col.border} border-slate-200/80 dark:border-slate-800`
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/70 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr ${col.color} text-white shadow-xs`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {col.title}
                </h3>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${col.badgeBg}`}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards Container */}
            <div className="flex-1 space-y-3 min-h-[300px]">
              {columnTasks.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 text-center p-4">
                  <p className="text-[11px] font-medium text-slate-400">
                    No tasks in {col.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Drag tasks here to update status
                  </p>
                </div>
              ) : (
                columnTasks.map((task, idx) => {
                  const isUpdating = updatingTaskId === task.id;
                  const canEdit = currentUser
                    ? canEditTask(currentUserRole as Role, task, currentUser.id)
                    : false;
                  const canDelete = currentUser
                    ? canDeleteTask(currentUserRole as Role, task, currentUser.id)
                    : false;

                  // Priority colors
                  const priorityColors = {
                    High: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60",
                    Medium:
                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60",
                    Low: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60",
                  }[task.priority] || "bg-slate-50 text-slate-700 border-slate-200";

                  return (
                    <div
                      key={`${task.id || idx}-${idx}`}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`group relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-[#1a152e] ${
                        canEdit ? "cursor-grab active:cursor-grabbing" : ""
                      } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {/* Top Row: Priority & Due Date */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColors}`}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Assignee & Creator Info */}
                      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        {task.assignee ? (
                          <div
                            className="flex items-center gap-1.5"
                            title={`Assigned to ${task.assignee.name} (${task.assignee.email})`}
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              {task.assignee.name
                                ? task.assignee.name.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                            <span className="max-w-[110px] truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Unassigned
                          </span>
                        )}

                        {/* Action buttons (Edit & Delete per RBAC) */}
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              title="Edit Task"
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/60 dark:hover:text-purple-300"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task)}
                              title="Delete Task"
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : (
                            <span
                              title="No delete permission (Owner, Admin or Creator/Assignee only)"
                              className="opacity-20 cursor-not-allowed p-0.5"
                            >
                              <Trash2 className="h-3 w-3 text-slate-400" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Move Buttons (if user has edit permission) */}
                      {canEdit && (
                        <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                          {col.id === "To Do" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickMove(task.id, "In Progress")
                              }
                              className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold dark:text-purple-400"
                            >
                              <span>Start Task</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {col.id === "In Progress" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickMove(task.id, "To Do")
                                }
                                className="flex items-center gap-1 text-slate-500 hover:text-slate-700 font-medium dark:text-slate-400"
                              >
                                <ArrowLeft className="h-3 w-3" />
                                <span>To Do</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickMove(task.id, "Done")}
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold dark:text-emerald-400"
                              >
                                <span>Complete</span>
                                <Check className="h-3 w-3" />
                              </button>
                            </>
                          )}

                          {col.id === "Done" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickMove(task.id, "In Progress")
                              }
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold dark:text-amber-400"
                            >
                              <ArrowLeft className="h-3 w-3" />
                              <span>Reopen</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
