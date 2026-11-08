"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Pencil, Trash2, LogOut, AlertTriangle } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function Header() {
  const { toggleSidebar, toggleMobileSidebar } = useUiStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  // Génération des initiales pour l'avatar (ex: Jean Dupont -> JD)
  const getInitials = (prenom?: string, nom?: string) => {
    const firstInitial = prenom ? prenom.charAt(0) : "";
    const lastInitial = nom ? nom.charAt(0) : "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
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
              variant="accent"
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
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/7 shrink-0">
                <AlertTriangle className="h-5 w-5 text-primary" />
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
              variant="accent"
              onClick={handleLogoutConfirm}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditProfileDialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog} />

      <header className="h-16 border-b bg-background flex items-center px-4 md:px-6 shrink-0 justify-between">
        <div className="flex items-center">
          {/* Mobile : ouvre le drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
            className="mr-2 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>

          {/* Desktop : étend / réduit la sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 hidden md:inline-flex"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Réduire ou étendre le menu</span>
          </Button>
        </div>

        {/* Partie droite du header : 
            1. Bouton mode sombre
            2. Avatar avec Popover affichant les infos et options au clic */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="relative h-9 w-9 rounded-full p-0 flex items-center justify-center font-semibold text-sm"
                    aria-label="Menu profil utilisateur"
                  >
                    {getInitials(user.prenom, user.nom)}
                  </Button>
                  }
              />
              <PopoverContent className="w-64 p-3 mt-1" align="end">
                {/* Infos de l'utilisateur connecté */}
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email || "default.admin@email.com"}
                  </p>
                </div>

                <div className="my-2 h-px bg-border" />

                {/* Options du profil (Modifier, Supprimer, Déconnexion) */}
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 px-2 font-normal"
                    onClick={() => {
                      setPopoverOpen(false);
                      setShowEditProfileDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier mon profil
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 px-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setPopoverOpen(false);
                      setShowDeleteProfileDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 px-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setPopoverOpen(false);
                      setShowLogoutDialog(true);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>
    </>
  );
}