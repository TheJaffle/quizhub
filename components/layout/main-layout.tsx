"use client";

import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import type React from "react";
import { useSidebar } from "./sidebar-context";

const SHOW_SIDEBAR = false;

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      {SHOW_SIDEBAR ? (
        <div className="z-50 relative">
          <AppSidebar />
        </div>
      ) : null}
      <div className={cn(SHOW_SIDEBAR ? (collapsed ? "xl:w-[calc(100%-70px)]" : "xl:w-[calc(100%-250px)]") : "w-full", "min-w-0 w-full max-w-full overflow-x-hidden")}>
        <Header showSidebar={SHOW_SIDEBAR} />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden overflow-y-auto p-3 md:p-4 xxl:p-6">{children}</main>
      </div>
    </div>
  );
}
