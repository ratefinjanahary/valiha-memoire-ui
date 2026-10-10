"use client";

import { useState, useEffect } from "react";
import {
  Loader2, Search, Trash2, Shield, UserStar,
  ChevronLeft, ChevronRight, AlertTriangle, Mail, Calendar,
  BookText, GraduationCap, Globe, CircleCheck, CircleX,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";
import { User } from "@/stores/authStore";
import { useAuthStore } from "@/stores/authStore";

interface AdminUser extends User {
  isActif?: boolean;
  createdAt?: string;
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Variants Motion pour l'animation d'entrée progressive */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const roleIcons = {
  ADMIN: UserStar,
  DOCUMENTALISTE: BookText,
  ETUDIANT: GraduationCap,
  PUBLIC: Globe,
};

export default function UsersManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Recherche et pagination */
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  /* Modales et état d'actions */
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [userToModifyRole, setUserToModifyRole] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchUsers = async (currentPage = page, searchQuery = search) => {
    setIsLoading(true);
    try {
      const response = await authService.getUsers(currentPage, limit, searchQuery || undefined);
      setUsers(response.items as AdminUser[]);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error("fetch users error:", err);
      toast.error("Erreur lors du chargement des utilisateurs. Seul un administrateur peut accéder à cette ressource.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleOpenDelete = (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte depuis cette interface d'administration.");
      return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await authService.deleteUser(userToDelete.id);
      toast.success(`L'utilisateur ${userToDelete.prenom} ${userToDelete.nom} a été supprimé`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setTotal((prev) => prev - 1);
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error("delete user error:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleOpenRoleChange = (user: AdminUser) => {
    setUserToModifyRole(user);
    setSelectedRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!userToModifyRole || !selectedRole) return;
    setIsUpdatingRole(true);
    try {
      await authService.updateRole(userToModifyRole.id, selectedRole);
      toast.success(`Le rôle de ${userToModifyRole.prenom} a été mis à jour avec succès en ${selectedRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userToModifyRole.id ? { ...u, role: selectedRole as any } : u))
      );
      setIsRoleDialogOpen(false);
    } catch (err: any) {
      console.error("update role error:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour du rôle");
    } finally {
      setIsUpdatingRole(false);
      setUserToModifyRole(null);
    }
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="font-bold text-xl">Accès Refusé</h3>
        <p className="text-muted-foreground text-sm">Seul un administrateur peut accéder à cette page de gestion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">
            Visualisez les comptes utilisateurs, modifiez leurs rôles d'accès ou supprimez des comptes.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, prénom, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Rechercher</Button>
      </form>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 border rounded-md">
          <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <motion.div
            key={`${page}-${search}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {users.map((u) => (
                <motion.div
                  key={u.id}
                  variants={cardVariants}
                  layout
                  exit="exit"
                >
                  <Card className="group relative overflow-hidden p-5 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-sm shrink-0 ring-2 ring-background">
                          {u.prenom?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm truncate">
                              {u.prenom} {u.nom}
                            </span>
                            {u.id === currentUser?.id && (
                              <Badge
                                variant="outline"
                              >
                                Vous
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges rôle + statut */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="gap-1">
                        {(() => {
                          const Icon = roleIcons[u.role as keyof typeof roleIcons] ?? Globe;
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {u.role}
                      </Badge>

                      {u.isActif !== false ? (
                        <Badge variant="outline">
                          <CircleCheck className="h-3 w-3" />Actif
                        </Badge>
                      ) : (
                        <Badge
                          className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20"
                          variant="outline"
                        >
                          <CircleX className="h-3 w-3" />Inactif
                        </Badge>
                      )}
                    </div>

                    {/* Date de création */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Inscrit le{" "}
                        {new Date(u.createdAt || "").toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Actions (poussées en bas de la carte) */}
                    <div className="mt-auto flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={() => handleOpenRoleChange(u)}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Rôle
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={u.id === currentUser?.id}
                        onClick={() => handleOpenDelete(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Affichage de {users.length} sur {total} utilisateurs
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Supprimer le compte</DialogTitle>
            </div>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <span className="font-semibold text-foreground">
                {userToDelete?.prenom} {userToDelete?.nom} ({userToDelete?.email})
              </span>{" "}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-1">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Oui, supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
            </div>
            <DialogDescription>
              Modifiez les privilèges de{" "}
              <span className="font-semibold text-foreground">
                {userToModifyRole?.prenom} {userToModifyRole?.nom}
              </span>{" "}
              sur l'application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-semibold">Nouveau rôle</label>
            <Select value={selectedRole} onValueChange={(val: string | null) => val && setSelectedRole(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">PUBLIC (Visiteur simple)</SelectItem>
                <SelectItem value="ETUDIANT">ETUDIANT</SelectItem>
                <SelectItem value="DOCUMENTALISTE">DOCUMENTALISTE</SelectItem>
                <SelectItem value="ADMIN">ADMIN (Administrateur global)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-1">
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isUpdatingRole}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={isUpdatingRole}>
              {isUpdatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Valider le changement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}