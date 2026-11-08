"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  ChartNetwork, 
  GraduationCap,
  Menu,
  LibraryBig, 
  Users, 
  type LucideIcon
} from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface NavLink {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

const navLinks: NavLink[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Utilisateurs", href: "/users", icon: Users, roles: ["ADMIN"] },
  { name: "Modération", href: "/moderation", icon: LibraryBig, roles: ["ADMIN", "DOCUMENTALISTE"] },
  { name: "Mémoires", href: "/memoires", icon: BookOpen },
  { name: "Recherche", href: "/search", icon: Search },
  { name: "Graphe", href: "/graph", icon: ChartNetwork },
];

/* Bouton menu (visible mobile only) */
export const MobileMenuButton: React.FC<{ className?: string }> = ({ className }) => {
  const { toggleMobileSidebar } = useUiStore();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      onClick={toggleMobileSidebar}
      aria-label="Ouvrir le menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};

/* Contenu partagé desktop / mobile */
interface SidebarContentProps {
  expanded: boolean;
  pathname: string;
  onNavigate?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  expanded, pathname, onNavigate,
}) => {
  const { user } = useAuthStore();

  return (
    <>
      {/* Logo & Brand */}
      <div className={cn("h-16 flex items-center border-b shrink-0", expanded ? "px-6" : "justify-center px-0")}>
        <GraduationCap className={cn("h-6 w-6 text-primary shrink-0", expanded && "mr-3")} />
        {expanded && <span className="font-bold text-lg tracking-tight whitespace-nowrap">Valiha</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navLinks
          .filter((link) => !link.roles || (user?.role && link.roles.includes(user.role)))
          .map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                title={!expanded ? link.name : undefined}
                aria-label={link.name}
                className={cn(
                  "flex items-center py-1.5 rounded-sm transition-colors font-semibold text-sm",
                  expanded ? "px-3" : "justify-center py-2",
                  isActive
                    ? "bg-primary/7 text-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", expanded && "mr-3")} />
                {expanded && <span className="whitespace-nowrap">{link.name}</span>}
              </Link>
            );
          })}
      </nav>
    </>
  );
};

/* ---------- Sidebar ---------- */
export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarOpen, isMobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  // Ferme le drawer à chaque changement de route
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  return (
    <>
      {/* Desktop : caché sur mobile */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex h-screen border-r flex-col shrink-0 overflow-hidden bg-background"
      >
        <SidebarContent
          expanded={isSidebarOpen}
          pathname={pathname}
        />
      </motion.aside>

      {/* Mobile : drawer en overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r bg-background md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <SidebarContent
                expanded
                pathname={pathname}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};