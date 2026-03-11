"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default function DashboardHeader() {
  const { user } = db.useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Tasks" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-sm border-b-2 border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(108,92,231,0.4)]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-white"
            >
              <path
                d="M2 7l3.5 3.5L12 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Task<span className="text-accent">Flow</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-accent-light text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          {user?.email && (
            <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[160px]">
              {user.email}
            </span>
          )}
          <button
            onClick={() => db.auth.signOut()}
            className="px-3 py-1.5 rounded-xl border-2 border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
