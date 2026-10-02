"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BookOpen, Search, GraduationCap } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mémoires", href: "/memoires", icon: BookOpen },
  { name: "Recherche", href: "/search", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen } = useUiStore();

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 250, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-screen bg-card border-r flex flex-col shrink-0 overflow-hidden"
        >
          {/* Logo & Brand */}
          <div className="h-16 flex items-center px-6 border-b shrink-0">
            <GraduationCap className="h-6 w-6 text-primary mr-3" />
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">Valiha App</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
