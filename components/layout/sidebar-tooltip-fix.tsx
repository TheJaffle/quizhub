"use client";

import type React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Compass, DollarSign, Home, LayoutDashboard, LogIn, LogOut, Settings, Trophy, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar } from "./sidebar-context";

const BRAND_NAME = "QI-FREE";

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; pseudo: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = await response.json();

        if (isMounted) {
          setCurrentUser(payload.user ?? null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });

    if (!response.ok) {
      return;
    }

    setCurrentUser(null);
    window.location.assign("/login");
  };

  return (
    <aside className={cn("sticky top-0 flex h-screen flex-col border-r bg-background transition-all duration-300", collapsed ? "w-[70px]" : "w-[250px]")}>
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          {!collapsed && <span className="text-xl font-bold">{BRAND_NAME}</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active={isActive("/dashboard")} />
          <NavItem href="/my-quizzes" icon={<Home className="h-5 w-5" />} label="My Quizzes" active={isActive("/my-quizzes")} />
          <NavItem href="/explore" icon={<Compass className="h-5 w-5" />} label="Explore Quizzes" active={isActive("/explore")} />

          <NavItem href="/categories" icon={<BookOpen className="h-5 w-5" />} label="Categories" active={isActive("/categories")} />
          <NavItem href="/leaderboard" icon={<Trophy className="h-5 w-5" />} label="Leaderboard" active={isActive("/leaderboard")} />
          <NavItem href="/affiliate" icon={<Users className="h-5 w-5" />} label="Affiliate Page" active={isActive("/affiliate")} />
          <NavItem href="/pricing" icon={<DollarSign className="h-5 w-5" />} label="Pricing Plan" active={isActive("/pricing")} />
          <NavItem href="/earnings" icon={<DollarSign className="h-5 w-5" />} label="Earnings & Wallet" active={isActive("/earnings")} />
          <NavItem href="/analytics" icon={<BarChart3 className="h-5 w-5" />} label="Results & Analytics" active={isActive("/analytics")} />
          <NavItem href="/settings" icon={<Settings className="h-5 w-5" />} label="Account Settings" active={isActive("/settings")} />
        </nav>
      </div>

      <div className="border-t py-4">
        <nav className="grid gap-1 px-2">
          {!isAuthLoading && currentUser ? <NavAction icon={<LogOut className="h-5 w-5" />} label="Déconnexion" onClick={handleLogout} /> : null}
          {!isAuthLoading && !currentUser ? (
            <>
              <NavItem href="/login" icon={<LogIn className="h-5 w-5" />} label="Connexion" active={isActive("/login")} />
              <NavItem href="/register" icon={<UserPlus className="h-5 w-5" />} label="Inscription" active={isActive("/register")} />
            </>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  nested?: boolean;
}

function NavItem({ href, icon, label, active, nested = false }: NavItemProps) {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return (
      <div className="relative group">
        <Link href={href} className={cn("flex h-10 w-10 items-center justify-center rounded-md transition-colors", active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground", nested && "h-6 w-6")}>
          {icon}
        </Link>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-sm font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] shadow-md border whitespace-nowrap">{label}</div>
      </div>
    );
  }

  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground", nested && "pl-6")}>
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function NavAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return (
      <div className="relative group">
        <button type="button" onClick={onClick} className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground">
          {icon}
        </button>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-sm font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] shadow-md border whitespace-nowrap">{label}</div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
