import { CheckSquare, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-purple-100/80 bg-white/50 backdrop-blur-xs dark:border-purple-950/60 dark:bg-[#13111c]/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-500 to-violet-400 text-white shadow-sm">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">TaskFlow</span>
            <span className="text-xs text-purple-700/80 dark:text-purple-300/80">
              — Assignment 2 – Task & Team Management App (SDN302)
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span>Next.js 15+ & Prisma & PostgreSQL</span>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="h-4 w-4 fill-purple-400 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-purple-100/60 pt-6 text-center text-xs text-slate-400 dark:border-purple-950/40">
          © {new Date().getFullYear()} TaskFlow. Built with Next.js App Router, Tailwind CSS, Prisma & Supabase.
        </div>
      </div>
    </footer>
  );
}
