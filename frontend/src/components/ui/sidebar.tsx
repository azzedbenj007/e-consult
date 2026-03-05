"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  MessageSquare,
  LayoutDashboard,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const navItems = [
  {
    label: "Chat IA",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Historique",
    href: "/history",
    icon: History,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--border))] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nova-600 text-sm font-bold text-white">
          N
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">
            NOVA-EQP
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Gestion biomedicale
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-nova-600/10 text-nova-500"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--sidebar-foreground))]"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[hsl(var(--border))] p-3">
        {user && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))]">
              {user.prenom} {user.nom}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Deconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 lg:hidden"
        aria-label="Menu"
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-[hsl(var(--foreground))]" />
        ) : (
          <Menu className="h-5 w-5 text-[hsl(var(--foreground))]" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 flex-shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}
