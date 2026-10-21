"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  CheckSquare,
  Plus,
  Shield,
  User,
  ArrowLeft,
  Calendar,
  Clock,
  Flag,
  Edit2,
  Trash2,
  UserPlus,
  Search,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  CircleDashed,
  Send,
  UserX,
  MessageSquare,
  LayoutGrid,
  List,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TeamItem, TeamMemberItem, TeamRole } from "@/types/team";
import { TaskItem, TaskStatus, TaskPriority } from "@/types/task";
import TaskModal from "@/components/TaskModal";
import TeamModal from "@/components/TeamModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import KanbanBoard from "@/components/KanbanBoard";
import TeamChat from "@/components/TeamChat";
import {
  canDeleteTeam,
  canEditTeam,
  canInviteMember,
  canRemoveMember,
  canEditTask,
  canDeleteTask,
  Role,
} from "@/lib/rbac";
import {
  subscribeToRealtimeChannel,
  broadcastLocally,
} from "@/lib/realtime-client";

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const router = useRouter();
  const { user, refreshTeams } = useAuth();

  const [team, setTeam] = useState<TeamItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab: tasks | chat | members
  const [activeTab, setActiveTab] = useState<"tasks" | "chat" | "members">("tasks");
  // Task view mode: kanban | list
  const [taskViewMode, setTaskViewMode] = useState<"kanban" | "list">("kanban");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority>("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");

  // Modals state for Tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("create");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Modals state for Team Edit
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  // Modals state for Delete (Task, Team, or Member)
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    type: "task" | "team" | "member";
    title: string;
    itemName?: string;
    description: string;
    targetId: string;
  }>({
    isOpen: false,
    type: "task",
    title: "",
    description: "",
    targetId: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline member add email state
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Role changing state
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Toast feedback
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setNotification({ message, type });
      setTimeout(() => {
        setNotification(null);
      }, 3500);
    },
    []
  );

  // Load team data
  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!teamId) return;
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        const data = await res.json();

        if (!ignore) {
          if (!res.ok || !data.success) {
            showNotification(data.error || "Failed to load team details", "error");
            return;
          }

          setTeam(data.data);
          setMembers(data.data.members || []);
          setTasks(data.data.tasks || []);
        }
      } catch {
        if (!ignore) {
          showNotification("Error loading team data", "error");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [teamId, showNotification]);

  // Real-time Collaboration Subscription
  useEffect(() => {
    if (!teamId) return;

    const channelName = `team-${teamId}`;
    const unsubscribe = subscribeToRealtimeChannel(
      channelName,
      (event, payload) => {
        switch (event) {
          case "task:created": {
            const newTask = payload as TaskItem;
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
            break;
          }
          case "task:updated": {
            const updatedTask = payload as TaskItem;
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
            break;
          }
          case "task:deleted": {
            const { taskId } = payload as { taskId: string };
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            break;
          }
          case "member:added": {
            const newMember = payload as TeamMemberItem;
            setMembers((prev) => {
              if (prev.some((m) => m.id === newMember.id || m.userId === newMember.userId))
                return prev;
              return [...prev, newMember];
            });
            break;
          }
          case "member:updated": {
            const updatedMember = payload as TeamMemberItem;
            setMembers((prev) =>
              prev.map((m) =>
                m.id === updatedMember.id || m.userId === updatedMember.userId
                  ? { ...m, role: updatedMember.role }
                  : m
              )
            );
            // If current user's role changed, update local team role
            if (user && updatedMember.userId === user.id) {
              setTeam((prev) =>
                prev
                  ? {
                      ...prev,
                      currentUserRole: updatedMember.role as TeamRole,
                    }
                  : prev
              );
            }
            break;
          }
          case "member:removed": {
            const { memberId, userId: removedUserId } = payload as {
              memberId: string;
              userId: string;
            };
            setMembers((prev) =>
              prev.filter((m) => m.id !== memberId && m.userId !== removedUserId)
            );
            // If current user was removed, redirect
            if (user && removedUserId === user.id) {
              showNotification("You were removed from this team", "error");
              router.push("/teams");
            }
            break;
          }
          case "team:updated": {
            const updatedTeam = payload as TeamItem;
            setTeam((prev) => (prev ? { ...prev, ...updatedTeam } : updatedTeam));
            break;
          }
          case "team:deleted": {
            showNotification("Team has been deleted", "error");
            router.push("/teams");
            break;
          }
          default:
            break;
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [teamId, user, router, showNotification]);

  // Determine current user's role in this team
  const currentUserRole: TeamRole = team?.currentUserRole || "MEMBER";
  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const canManageMembers = canInviteMember(currentUserRole);

  // Quick status update for Kanban drag & drop
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification(data.error || "Failed to update task", "error");
        return;
      }

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
      broadcastLocally(`team-${teamId}`, "task:updated", data.data);
      showNotification(`Task moved to ${newStatus}`);
    } catch {
      showNotification("Error updating task status", "error");
    }
  };

  // Add member by email (Owner & Admin)
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    try {
      setIsInviting(true);
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        setInviteError(data.error || "Failed to add member.");
        return;
      }

      setMembers((prev) => {
        if (prev.some((m) => m.id === data.data.id || m.userId === data.data.userId)) {
          return prev;
        }
        return [...prev, data.data];
      });
      broadcastLocally(`team-${teamId}`, "member:added", data.data);
      setInviteEmail("");
      showNotification(`Added ${data.data.user.name} to the team!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add member";
      setInviteError(msg);
    } finally {
      setIsInviting(false);
    }
  };

  // Update member role (Owner and Admin)
  const handleRoleChange = async (member: TeamMemberItem, newRole: "ADMIN" | "MEMBER") => {
    if (member.role === newRole || updatingMemberId) return;

    setUpdatingMemberId(member.id);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${member.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification(data.error || "Failed to update member role", "error");
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
      broadcastLocally(`team-${teamId}`, "member:updated", data.data);
      showNotification(`Role of ${member.user.name} updated to ${newRole}`);
    } catch {
      showNotification("Error updating member role", "error");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Delete handler (Task, Team, or Member)
  const handleConfirmDelete = async () => {
    const { type, targetId } = deleteModalConfig;
    try {
      setIsDeleting(true);

      if (type === "task") {
        const res = await fetch(`/api/tasks/${targetId}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to delete task");

        setTasks((prev) => prev.filter((t) => t.id !== targetId));
        broadcastLocally(`team-${teamId}`, "task:deleted", { taskId: targetId, teamId });
        showNotification("Task deleted successfully!");
      } else if (type === "member") {
        const res = await fetch(`/api/teams/${teamId}/members/${targetId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to remove member");

        setMembers((prev) => prev.filter((m) => m.id !== targetId && m.userId !== targetId));
        setTasks((prev) =>
          prev.map((t) =>
            t.assigneeId === targetId
              ? { ...t, assigneeId: null, assignee: null }
              : t
          )
        );
        broadcastLocally(`team-${teamId}`, "member:removed", {
          memberId: targetId,
          userId: targetId,
          teamId,
        });
        showNotification("Member removed from team!");
      } else if (type === "team") {
        const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to delete team");

        broadcastLocally(`team-${teamId}`, "team:deleted", { id: teamId });
        showNotification("Team deleted successfully!");
        refreshTeams();
        router.push("/teams");
        return;
      }

      setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      showNotification(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Callback on task saved from modal
  const handleTaskSaved = (savedTask: TaskItem) => {
    if (taskModalMode === "create") {
      setTasks((prev) => {
        if (prev.some((t) => t.id === savedTask.id)) {
          return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
        }
        return [savedTask, ...prev];
      });
      broadcastLocally(`team-${teamId}`, "task:created", savedTask);
      showNotification("Task created successfully!");
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === savedTask.id ? savedTask : t))
      );
      broadcastLocally(`team-${teamId}`, "task:updated", savedTask);
      showNotification("Task updated successfully!");
    }
  };

  // Deduplicate members to prevent duplicate key errors
  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    return members.filter((m) => {
      const key = m.id || m.userId;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [members]);

  // Deduplicate tasks
  const uniqueTasks = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((t) => {
      if (!t.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [tasks]);

  // Filter tasks logic
  const filteredTasks = useMemo(() => {
    return uniqueTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      let matchesAssignee = true;
      if (assigneeFilter === "unassigned") {
        matchesAssignee = !task.assigneeId;
      } else if (assigneeFilter !== "All") {
        matchesAssignee = task.assigneeId === assigneeFilter;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [uniqueTasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  // Task Stats
  const taskCounts = useMemo(() => {
    return {
      all: uniqueTasks.length,
      todo: uniqueTasks.filter((t) => t.status === "To Do").length,
      inProgress: uniqueTasks.filter((t) => t.status === "In Progress").length,
      done: uniqueTasks.filter((t) => t.status === "Done").length,
    };
  }, [uniqueTasks]);

  if (isLoading && !team) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading team workspace...
        </p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Team Not Found
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          This team does not exist or you do not have permission to access it.
        </p>
        <Link
          href="/teams"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl transition-all ${
            notification.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/80 dark:text-emerald-200"
              : "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/80 dark:text-rose-200"
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link
          href="/teams"
          className="flex items-center gap-1.5 transition hover:text-purple-600 dark:hover:text-purple-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Teams</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {team.name}
        </span>
      </div>

      {/* Team Header Banner */}
      <div className="mt-4 rounded-3xl border border-purple-100/90 bg-white p-6 shadow-xs dark:border-purple-950/60 dark:bg-[#181428] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white shadow-md shadow-purple-500/20">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {team.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    isOwner
                      ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-300"
                      : isAdmin
                      ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950 dark:text-blue-300"
                      : "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950 dark:text-purple-300"
                  }`}
                >
                  {isOwner ? (
                    <Crown className="h-3 w-3 text-amber-600" />
                  ) : isAdmin ? (
                    <Shield className="h-3 w-3 text-blue-600" />
                  ) : (
                    <User className="h-3 w-3 text-purple-600" />
                  )}
                  <span>{currentUserRole}</span>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {team.description || "No description provided for this team."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span>
                  Owner:{" "}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {team.owner?.name}
                  </strong>
                </span>
                <span>•</span>
                <span>{uniqueMembers.length} members</span>
                <span>•</span>
                <span>{uniqueTasks.length} tasks</span>
              </div>
            </div>
          </div>

          {/* Action buttons for Team */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Team (Owner only) */}
            {canEditTeam(currentUserRole as Role) && (
              <button
                type="button"
                onClick={() => setIsEditTeamModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-purple-50 hover:text-purple-600 dark:border-slate-800 dark:bg-[#141022] dark:text-slate-300"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Team</span>
              </button>
            )}

            {/* Delete Team (Strict RBAC: Only OWNER. Hidden/Disabled for Admin & Member) */}
            {canDeleteTeam(currentUserRole as Role) ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteModalConfig({
                    isOpen: true,
                    type: "team",
                    title: "Delete Team",
                    itemName: team.name,
                    description:
                      "This action will permanently delete all members, tasks, and messages in this team.",
                    targetId: team.id,
                  });
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-xs transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Team</span>
              </button>
            ) : null}

            {/* Create Task (Owner, Admin, Member) */}
            <button
              type="button"
              onClick={() => {
                setTaskModalMode("create");
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-500/25 transition hover:from-purple-700 hover:to-violet-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: Tasks | Live Chat | Members */}
        <div className="mt-8 flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition shrink-0 ${
              activeTab === "tasks"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Task Board ({uniqueTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition shrink-0 ${
              activeTab === "chat"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <div className="flex items-center gap-1.5">
              <span>Team Chat</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition shrink-0 ${
              activeTab === "members"
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Members ({uniqueMembers.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TASK BOARD (Kanban & List with Live Sync) */}
      {activeTab === "tasks" && (
        <div className="mt-6 space-y-6">
          {/* Top Control Bar: Status Cards + View Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Quick status counter pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className={`rounded-2xl border p-3 text-left transition ${
                  statusFilter === "All"
                    ? "border-purple-400 bg-purple-50/80 shadow-xs dark:border-purple-800 dark:bg-purple-950/60"
                    : "border-slate-200 bg-white hover:border-purple-200 dark:border-slate-800 dark:bg-[#181428]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>All Tasks</span>
                  <ListTodo className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {taskCounts.all}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("To Do")}
                className={`rounded-2xl border p-3 text-left transition ${
                  statusFilter === "To Do"
                    ? "border-blue-400 bg-blue-50/80 shadow-xs dark:border-blue-800 dark:bg-blue-950/60"
                    : "border-slate-200 bg-white hover:border-blue-200 dark:border-slate-800 dark:bg-[#181428]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>To Do</span>
                  <CircleDashed className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-1 text-lg font-black text-blue-600 dark:text-blue-400">
                  {taskCounts.todo}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("In Progress")}
                className={`rounded-2xl border p-3 text-left transition ${
                  statusFilter === "In Progress"
                    ? "border-amber-400 bg-amber-50/80 shadow-xs dark:border-amber-800 dark:bg-amber-950/60"
                    : "border-slate-200 bg-white hover:border-amber-200 dark:border-slate-800 dark:bg-[#181428]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>In Progress</span>
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-1 text-lg font-black text-amber-600 dark:text-amber-400">
                  {taskCounts.inProgress}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("Done")}
                className={`rounded-2xl border p-3 text-left transition ${
                  statusFilter === "Done"
                    ? "border-emerald-400 bg-emerald-50/80 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/60"
                    : "border-slate-200 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-[#181428]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Done</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {taskCounts.done}
                </div>
              </button>
            </div>

            {/* View Switcher: Kanban vs List */}
            <div className="flex items-center justify-end">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
                <button
                  type="button"
                  onClick={() => setTaskViewMode("kanban")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    taskViewMode === "kanban"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-purple-600 dark:text-slate-400"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskViewMode("list")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    taskViewMode === "list"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-purple-600 dark:text-slate-400"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
            <div className="relative min-w-[200px] flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, description..."
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pr-3 pl-9 text-xs text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-[#141022] dark:focus:bg-[#201836] dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Flag className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-purple-500 dark:border-slate-700 dark:bg-[#141022] dark:text-slate-200"
              >
                <option value="All">Priority: All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-purple-500 dark:border-slate-700 dark:bg-[#141022] dark:text-slate-200"
              >
                <option value="All">Assignee: All</option>
                <option value="unassigned">Unassigned</option>
                {uniqueMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MAIN TASK VIEW AREA */}
          {taskViewMode === "kanban" ? (
            <KanbanBoard
              tasks={filteredTasks}
              currentUser={user}
              currentUserRole={currentUserRole}
              onEditTask={(task) => {
                setTaskModalMode("edit");
                setSelectedTask(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={(task) => {
                setDeleteModalConfig({
                  isOpen: true,
                  type: "task",
                  title: "Delete Task",
                  itemName: task.title,
                  description:
                    "This action will permanently delete this task from the project.",
                  targetId: task.id,
                });
              }}
              onStatusChange={handleStatusChange}
            />
          ) : (
            /* LIST VIEW */
            filteredTasks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-purple-200 bg-white/50 p-12 text-center dark:border-purple-900/60 dark:bg-[#181428]/40">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                  <CheckSquare className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  No tasks found
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery || statusFilter !== "All" || priorityFilter !== "All" || assigneeFilter !== "All"
                    ? "Try adjusting your filters to view more tasks."
                    : "No tasks in this team yet. Any team member can create a task!"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTaskModalMode("create");
                    setSelectedTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/25 transition hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Create First Task
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-[#181428]">
                {filteredTasks.map((task) => {
                  const canEdit = user
                    ? canEditTask(currentUserRole as Role, task, user.id)
                    : false;
                  const canDelete = user
                    ? canDeleteTask(currentUserRole as Role, task, user.id)
                    : false;

                  const priorityColors = {
                    High: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300",
                    Medium:
                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300",
                    Low: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300",
                  }[task.priority] || "bg-slate-50 text-slate-700";

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/60 dark:hover:bg-purple-950/20"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColors}`}
                          >
                            {task.priority}
                          </span>
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                            {task.status}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-400">
                          {task.assignee ? (
                            <span>
                              Assignee:{" "}
                              <strong className="text-slate-700 dark:text-slate-300">
                                {task.assignee.name}
                              </strong>
                            </span>
                          ) : (
                            <span className="italic">Unassigned</span>
                          )}
                          <span>•</span>
                          <span>
                            Created by:{" "}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {task.creator?.name}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTask(task);
                              setTaskModalMode("edit");
                              setIsTaskModalOpen(true);
                            }}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-purple-50 hover:text-purple-600 dark:border-slate-800 dark:bg-[#141022] dark:text-slate-300"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalConfig({
                                isOpen: true,
                                type: "task",
                                title: "Delete Task",
                                itemName: task.title,
                                description:
                                  "This action will permanently delete this task from the project.",
                                targetId: task.id,
                              });
                            }}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span
                            title="Only Owner, Admin, or the task creator/assignee can delete"
                            className="cursor-not-allowed rounded-xl px-2 py-1 text-[10px] text-slate-400 italic"
                          >
                            No delete permission
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: LIVE TEAM CHAT */}
      {activeTab === "chat" && (
        <div className="mt-6">
          <TeamChat
            teamId={teamId}
            teamName={team.name}
            currentUser={user}
          />
        </div>
      )}

      {/* TAB 3: MEMBERS MANAGEMENT (Advanced RBAC: Owner & Admin management) */}
      {activeTab === "members" && (
        <div className="mt-6 space-y-6">
          {/* Add member form (OWNER & ADMIN ONLY) */}
          {canManageMembers ? (
            <div className="rounded-3xl border border-purple-200/90 bg-purple-50/40 p-6 dark:border-purple-900/60 dark:bg-[#181428]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Invite New Team Member
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Team Owners and Admins can add members by their registered email address.
                  </p>
                </div>
              </div>

              {inviteError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <form
                onSubmit={handleInviteMember}
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member-email@example.com"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-hidden dark:border-slate-800 dark:bg-[#141022] dark:focus:bg-[#201836] dark:text-white dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/25 transition hover:bg-purple-700 disabled:opacity-60"
                >
                  {isInviting ? (
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
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#181428]/60 dark:text-slate-400">
              You are currently a MEMBER. Only the Team Owner and Admins have permission to invite new members.
            </div>
          )}

          {/* Members List with Role Dropdowns */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#181428]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Team Members ({uniqueMembers.length})
            </h3>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {uniqueMembers.map((member, idx) => {
                const memberIsOwner =
                  member.role === "OWNER" || member.userId === team.ownerId;
                const memberIsAdmin = member.role === "ADMIN" && !memberIsOwner;
                const isCurrentUser = member.userId === user?.id;

                // RBAC permission for role changing:
                // - Owner can change any non-owner member's role
                // - Admin can only change MEMBER role
                const canChangeThisMemberRole =
                  !memberIsOwner &&
                  (isOwner || (isAdmin && member.role === "MEMBER" && !isCurrentUser));

                // RBAC permission for removing this member:
                const canRemoveThisMember = canRemoveMember(
                  currentUserRole as Role,
                  memberIsOwner
                    ? "OWNER"
                    : memberIsAdmin
                    ? "ADMIN"
                    : "MEMBER",
                  isCurrentUser
                );

                return (
                  <div
                    key={`${member.id || member.userId || idx}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-xs font-bold text-white shadow-xs">
                        {member.user.name
                          ? member.user.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {member.user.name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] text-purple-600 font-semibold">
                              (You)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Role Selector or Badge */}
                      {canChangeThisMemberRole ? (
                        <div className="relative">
                          <select
                            value={member.role}
                            disabled={updatingMemberId === member.id}
                            onChange={(e) =>
                              handleRoleChange(
                                member,
                                e.target.value as "ADMIN" | "MEMBER"
                              )
                            }
                            className={`rounded-xl border px-3 py-1 text-xs font-semibold transition focus:outline-hidden ${
                              member.role === "ADMIN"
                                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                                : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300"
                            }`}
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            memberIsOwner
                              ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                              : memberIsAdmin
                              ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                              : "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {memberIsOwner && (
                            <Crown className="h-3 w-3 text-amber-600" />
                          )}
                          {memberIsAdmin && (
                            <Shield className="h-3 w-3 text-blue-600" />
                          )}
                          <span>
                            {memberIsOwner
                              ? "Owner"
                              : memberIsAdmin
                              ? "Admin"
                              : "Member"}
                          </span>
                        </span>
                      )}

                      {/* Remove Member Button */}
                      {canRemoveThisMember && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteModalConfig({
                              isOpen: true,
                              type: "member",
                              title: "Remove Member",
                              itemName: member.user.name,
                              description: `Are you sure you want to remove "${member.user.name}" (${member.user.email}) from this team? Tasks assigned to this member will become unassigned.`,
                              targetId: member.id,
                            });
                          }}
                          className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                          title="Remove member from team"
                        >
                          <UserX className="h-4 w-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        mode={taskModalMode}
        teamId={teamId}
        teamMembers={uniqueMembers}
        task={selectedTask}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={handleTaskSaved}
      />

      {/* Edit Team Modal (Owner only) */}
      <TeamModal
        isOpen={isEditTeamModalOpen}
        mode="edit"
        initialTeam={team}
        onClose={() => setIsEditTeamModalOpen(false)}
        onSuccess={(updated) => {
          setTeam((prev) => (prev ? { ...prev, ...updated } : updated));
          showNotification("Team details updated successfully!");
          refreshTeams();
        }}
      />

      {/* Reusable Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        itemName={deleteModalConfig.itemName}
        description={deleteModalConfig.description}
        isDeleting={isDeleting}
        onClose={() =>
          setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
