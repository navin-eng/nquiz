"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, User, Sun, Moon, LayoutDashboard, Shield } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <nav className="glass-panel glass-card w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 mb-8">
      <div className="font-black text-2xl text-gradient">
        <Link href={session?.user?.role === "ADMIN" ? "/admin" : "/dashboard"}>
          nQuiz
        </Link>
      </div>

      <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
        {session?.user?.role === "ADMIN" && (
          <div className="segmented-control">
            <Link 
              href="/admin" 
              className={`segment-item text-sm ${pathname?.startsWith("/admin") ? "is-active" : ""}`}
            >
              <Shield size={16} /> Admin
            </Link>
            <Link 
              href="/dashboard" 
              className={`segment-item text-sm ${pathname?.startsWith("/dashboard") ? "is-active" : ""}`}
            >
              <LayoutDashboard size={16} /> User
            </Link>
          </div>
        )}

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="icon-btn"
          title="Toggle Theme"
          suppressHydrationWarning
        >
          {theme === 'dark' ? <Sun size={18} className="text-warning-light" /> : <Moon size={18} className="text-primary" />}
        </button>

        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
          <User size={16} />
          <span>{session?.user?.name || session?.user?.email}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn btn-secondary text-sm px-3 py-1.5"
        >
          <LogOut size={16} />
          <span className="hidden md:block">Logout</span>
        </button>
      </div>
    </nav>
  );
}
