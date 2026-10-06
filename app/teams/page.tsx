"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Shield,
  User,
  ArrowRight,
  CheckSquare,
  Sparkles,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TeamItem } from "@/types/team";
import TeamModal from "@/components/TeamModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function TeamsPage() {
  const { user, refreshTeams } = useAuth();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal create/edit team
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamModalMode, setTeamModalMode] = useState<"create" | "edit">("create");
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);

  // Modal delete team
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/teams");
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setTeams(data.data);
        }
      } catch {
        if (!ignore) {
          showNotification("Could not load team list", "error");
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
  }, [showNotification]);

  // Handler for create/edit success
  const handleTeamSaved = (savedTeam: TeamItem) => {
    if (teamModalMode === "create") {
      setTeams((prev) => [savedTeam, ...prev]);
      showNotification(`Team "${savedTeam.name}" created successfully!`);
    } else {
      setTeams((prev) =>
        prev.map((t) => (t.id === savedTeam.id ? { ...t, ...savedTeam } : t))
      );
      showNotification(`Team "${savedTeam.name}" updated successfully!`);
    }
    refreshTeams();
  };

  // Handler for team deletion (Owner only)
  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete team");
      }

      setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id));
      showNotification(`Deleted team "${teamToDelete.name}"`);
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);
      refreshTeams();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting team";
      showNotification(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter teams by search
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Statistics
  const ownedCount = teams.filter((t) => t.currentUserRole === "OWNER").length;
  const memberCount = teams.filter((t) => t.currentUserRole !== "OWNER").length;

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

      {/* Header & Create Team Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center rounded-full bg-purple-100 px-2.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Sparkles className="mr-1 h-3 w-3" />
              Collaborative Workspace
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-purple-600 dark:text-purple-400">{user?.name}</span>! Manage teams you own or participate in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTeamModalMode("create");
            setSelectedTeam(null);
            setIsTeamModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-700 hover:to-violet-700 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-purple-100/90 bg-white/90 p-5 shadow-xs dark:border-purple-950/60 dark:bg-[#181428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
              Total Teams
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {teams.length}
          </div>
          <p className="mt-1 text-xs text-slate-400">All teams you are part of</p>
        </div>

        <div className="rounded-3xl border border-purple-100/90 bg-white/90 p-5 shadow-xs dark:border-purple-950/60 dark:bg-[#181428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
              Teams Owned (Owner)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-400">
            {ownedCount}
          </div>
          <p className="mt-1 text-xs text-slate-400">Full admin & invite permissions</p>
        </div>

        <div className="rounded-3xl border border-purple-100/90 bg-white/90 p-5 shadow-xs dark:border-purple-950/60 dark:bg-[#181428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
              Teams Joined (Member)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {memberCount}
          </div>
          <p className="mt-1 text-xs text-slate-400">Collaborating on team tasks</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name or description..."
            className="block w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pr-4 pl-10 text-xs text-slate-900 transition focus:border-purple-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-purple-500/15 dark:border-slate-800 dark:bg-[#181428] dark:focus:bg-[#201836] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-[#181428]/50"
              />
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          /* Empty state */
          <div className="rounded-3xl border border-dashed border-purple-200 bg-white/50 p-12 text-center dark:border-purple-900/60 dark:bg-[#181428]/40">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery ? "No matching teams found" : "You haven't joined any teams yet"}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating your first team to collaborate with teammates and manage tasks together!"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setTeamModalMode("create");
                  setSelectedTeam(null);
                  setIsTeamModalOpen(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/25 transition hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Create Team Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => {
              const isOwner = team.currentUserRole === "OWNER";
              return (
                <div
                  key={team.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-purple-100/90 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 dark:border-purple-950/60 dark:bg-[#181428] dark:hover:border-purple-800"
                >
                  <div>
                    {/* Header: Role Badge & Action Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${
                          isOwner
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/60"
                        }`}
                      >
                        {isOwner ? (
                          <>
                            <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span>Owner</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            <span>Member</span>
                          </>
                        )}
                      </span>

                      {/* Owner quick actions */}
                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Edit team"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedTeam(team);
                              setTeamModalMode("edit");
                              setIsTeamModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete team"
                            onClick={(e) => {
                              e.preventDefault();
                              setTeamToDelete(team);
                              setIsDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Team Name & Description */}
                    <Link href={`/teams/${team.id}`} className="mt-3 block">
                      <h3 className="text-base font-bold text-slate-900 transition group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                        {team.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {team.description || "No description provided for this team."}
                      </p>
                    </Link>
                  </div>

                  {/* Footer Meta & Open Button */}
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{team._count?.members ?? team.members?.length ?? 1} members</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                          <span>{team._count?.tasks ?? team.tasks?.length ?? 0} tasks</span>
                        </span>
                      </div>

                      <Link
                        href={`/teams/${team.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-purple-600 transition hover:gap-1.5 hover:text-purple-700 dark:text-purple-400"
                      >
                        <span>Open Board</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Modal (Create/Edit) */}
      <TeamModal
        isOpen={isTeamModalOpen}
        mode={teamModalMode}
        initialTeam={selectedTeam}
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={handleTeamSaved}
      />

      {/* Delete Team Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Team"
        itemName={teamToDelete?.name}
        description="All members and tasks in this team will be permanently deleted. Only the team owner can perform this action."
        isDeleting={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
