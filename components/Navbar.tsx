"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  CheckSquare,
  Menu,
  X,
  Users,
  Home,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, teams, logout, isLoading } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(event.target as Node)
      ) {
        setTeamDropdownOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    ...(user ? [{ name: "Teams", href: "/teams", icon: Users }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-100/80 bg-white/85 backdrop-blur-md dark:border-purple-950/60 dark:bg-[#161224]/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white shadow-md shadow-purple-500/25">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                TaskFlow
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                Team & Task Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-purple-100/80 text-purple-700 shadow-xs dark:bg-purple-950/70 dark:text-purple-300"
                      : "text-slate-600 hover:bg-purple-50/70 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-purple-950/40 dark:hover:text-purple-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Auth State */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : user ? (
            <>
              {/* Team Selector Dropdown */}
              <div className="relative" ref={teamDropdownRef}>
                <button
                  type="button"
                  onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/60 px-3.5 py-1.5 text-xs font-semibold text-purple-700 transition-all hover:bg-purple-100/80 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-purple-300"
                >
                  <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Select Team</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                    {teams.length}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-purple-500" />
                </button>

                {teamDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-[#1a152e]">
                    <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Your Teams
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                      {teams.length === 0 ? (
                        <div className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          You haven&apos;t joined any team
                        </div>
                      ) : (
                        teams.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTeamDropdownOpen(false);
                              router.push(`/teams/${t.id}`);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700 dark:text-slate-200 dark:hover:bg-purple-950/60 dark:hover:text-purple-300"
                          >
                            <span className="truncate pr-2">{t.name}</span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                t.currentUserRole === "OWNER"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              }`}
                            >
                              {t.currentUserRole || "MEMBER"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                      <Link
                        href="/teams"
                        onClick={() => setTeamDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/60"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Manage & Create Team
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Badge / Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-purple-300 hover:bg-purple-50/50 dark:border-slate-800 dark:bg-[#1a152e] dark:text-slate-200"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 text-[11px] font-bold text-white shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[120px] truncate font-semibold">
                    {user.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-[#1a152e]">
                    <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                    <div className="pt-1">
                      <Link
                        href="/teams"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-purple-950/60"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Team List
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {/* Not Logged In: Login + Register */}
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl border border-purple-200/80 bg-white/90 px-3.5 py-2 text-xs font-semibold text-purple-700 shadow-xs transition hover:bg-purple-50 dark:border-purple-900/60 dark:bg-[#1a152e] dark:text-purple-300"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-700 hover:to-violet-700 hover:shadow-purple-500/35"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-purple-50 dark:text-slate-300 dark:hover:bg-purple-950"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-purple-100 bg-white/95 px-4 pt-2 pb-4 shadow-lg backdrop-blur-md dark:border-purple-950 dark:bg-[#161224] md:hidden">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-purple-100/80 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300"
                      : "text-slate-600 hover:bg-purple-50/70 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-purple-950/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}

            {user ? (
              <div className="mt-2 border-t border-purple-100 pt-3 dark:border-purple-950">
                <div className="px-3 py-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                </div>

                {teams.length > 0 && (
                  <div className="mt-2 px-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Your Teams
                    </p>
                    <div className="mt-1 space-y-1">
                      {teams.map((t) => (
                        <Link
                          key={t.id}
                          href={`/teams/${t.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between rounded-lg py-1.5 text-xs text-slate-700 hover:text-purple-600 dark:text-slate-300"
                        >
                          <span className="truncate">{t.name}</span>
                          <span className="text-[10px] text-purple-600">
                            {t.currentUserRole}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-purple-100 pt-3 dark:border-purple-950">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
