"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  ChartNetwork, 
  GraduationCap,
  Menu,
  LogOut, 
  Pencil,
  User,  
  LibraryBig , 
  Users, 
  AlertTriangle,
  Trash2, 
  type LucideIcon
} from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { EditProfileDialog } from "@/components/users/edit-profile-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";

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

/* Bouton menu (à mettre dans ton header, visible mobile only) */
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
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  onLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  expanded, pathname, onNavigate, onEditProfile, onDeleteProfile, onLogout,
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

      {/* Theme + Profil */}
      <div
        className={cn(
          "border-t px-3 py-3 flex items-center shrink-0",
          expanded ? "justify-between" : "flex-col gap-2 justify-center"
        )}
      >
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Profil" />}
          >
            <User className="h-5 w-5" />
            <span className="sr-only">Menu utilisateur</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56 mb-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "default.admin@email.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem onClick={onEditProfile}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier mon profil
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-destructive/10 hover:text-destructive" onClick={onDeleteProfile}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer mon compte
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-destructive/10 hover:text-destructive" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

/* ---------- Sidebar ---------- */
export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, isMobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const openEditProfile = () => { setMobileSidebarOpen(false); setShowEditProfileDialog(true); }

  // Ferme le drawer à chaque changement de route
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutDialog(false);
    router.push("/");
  };

  const handleDeleteProfileConfirm = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await authService.deleteUser(user.id);
      toast.success("Votre compte a été supprimé avec succès.");
      logout();
      router.push("/");
    } catch (err: any) {
      console.error("delete profile error:", err);
      toast.error("Une erreur est survenue lors de la suppression de votre compte.");
    } finally {
      setIsDeleting(false);
      setShowDeleteProfileDialog(false);
    }
  };

  const openDelete = () => { setMobileSidebarOpen(false); setShowDeleteProfileDialog(true); };
  const openLogout = () => { setMobileSidebarOpen(false); setShowLogoutDialog(true); };

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
                <Spinner className="h-4 w-4 animate-spin mr-2" />
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
              Êtes-vous sûr de vouloir vous déconnecter ? Votre session sera terminée et vous serez redirigé vers la page d'accueil.
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

      <EditProfileDialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog} />

      {/* Desktop : caché sur mobile */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex h-screen border-r flex-col shrink-0 overflow-hidden"
      >
        <SidebarContent
          expanded={isSidebarOpen}
          pathname={pathname}
          onEditProfile={openEditProfile}
          onDeleteProfile={openDelete}
          onLogout={openLogout}
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
                onEditProfile={openEditProfile}
                onDeleteProfile={openDelete}
                onLogout={openLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
