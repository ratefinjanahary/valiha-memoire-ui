"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BookOpen, Search, GraduationCap, LogOut, User, AlertTriangle, BookCheck, Users, Trash2, Loader2 } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { type LucideIcon } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

const navLinks: NavLink[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Utilisateurs", href: "/users", icon: Users, roles: ["ADMIN"] },
  { name: "Modération", href: "/moderation", icon: BookCheck, roles: ["ADMIN", "DOCUMENTALISTE"] },
  { name: "Mémoires", href: "/memoires", icon: BookOpen },
  { name: "Recherche", href: "/search", icon: Search },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutDialog(false);
    router.push("/login");
  };

  const handleDeleteProfileConfirm = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await authService.deleteUser(user.id);
      toast.success("Votre compte a été supprimé avec succès.");
      logout();
      router.push("/login");
    } catch (err: any) {
      console.error("delete profile error:", err);
      toast.error("Une erreur est survenue lors de la suppression de votre compte.");
    } finally {
      setIsDeleting(false);
      setShowDeleteProfileDialog(false);
    }
  };

  return (
    <>
      {/* Delete Profile Confirmation Dialog */}
      <Dialog open={showDeleteProfileDialog} onOpenChange={setShowDeleteProfileDialog}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Supprimer mon compte</DialogTitle>
            </div>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est définitive et toutes vos données seront perdues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowDeleteProfileDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={handleDeleteProfileConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? "Suppression..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Confirmer la déconnexion</DialogTitle>
            </div>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Votre session sera terminée et vous serez redirigé vers la page de connexion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Annuler
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={handleLogoutConfirm}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen border-r flex flex-col shrink-0"
          >
            {/* Logo & Brand */}
            <div className="h-16 flex items-center px-6 border-b shrink-0">
              <GraduationCap className="h-6 w-6 text-primary mr-3" />
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">Valiha App</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-5 px-3 space-y-2 overflow-y-auto">
              {navLinks
                .filter((link) => !link.roles || (user?.role && link.roles.includes(user.role)))
                .map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center px-3 py-1.5 rounded-sm transition-colors font-semibold text-[15px]",
                        isActive
                          ? "bg-primary/7 text-primary"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <Icon className="h-5 w-5 mr-3 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
            </nav>

            {/* Bottom: Theme + Profile */}
            <div className="border-t px-3 py-3 flex items-center justify-between shrink-0">
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profil" />
                  }
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Menu utilisateur</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56 mb-1">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.prenom} {user?.nom}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email || "default.admin@email.com"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuItem
                    className="text-destructive hover:text-destructive hover:bg-none"
                    onClick={() => setShowDeleteProfileDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive hover:text-destructive hover:bg-none"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
