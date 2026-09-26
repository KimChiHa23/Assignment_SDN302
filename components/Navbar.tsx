"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CheckSquare, Menu, X, Users, Home, LogIn } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Teams", href: "/teams", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-100/80 bg-white/80 backdrop-blur-md dark:border-purple-950/60 dark:bg-[#161224]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-violet-400 text-white shadow-md shadow-purple-400/30">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              TaskFlow
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">
              Team & Task Manager
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Action button */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-purple-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-purple-700 shadow-xs transition-all hover:bg-purple-50 hover:border-purple-300 dark:border-purple-900/60 dark:bg-[#1a152e] dark:text-purple-200 dark:hover:bg-purple-950/60"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
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
        <div className="border-b border-purple-100 bg-white/95 px-4 pt-2 pb-4 dark:border-purple-950 dark:bg-[#161224] md:hidden">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-base font-medium ${
                    isActive
                      ? "bg-purple-100/80 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300"
                      : "text-slate-600 hover:bg-purple-50/70 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-purple-950/40 dark:hover:text-purple-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-600"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
