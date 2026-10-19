"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Loader2, Search, SearchX, Trash2, Shield, UserStar, Ellipsis,
  ChevronLeft, ChevronRight, AlertTriangle,
  BookText, GraduationCap, Globe, CircleCheck, CircleX,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { User } from "@/stores/authStore";
import { useAuthStore } from "@/stores/authStore";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

interface AdminUser extends User {
  isActif?: boolean;
  createdAt?: string;
}

type RoleMeta = {
  icon: LucideIcon;
  label: string;
  description: string;
};

/*  Métadonnées des rôles et statuts (à ajuster selon tes vraies règles) */

const ROLES: Record<string, RoleMeta> = {
  ADMIN: {
    icon: UserStar,
    label: "Administrateur",
    description: "Accès complet : utilisateurs, modération et journal d'audit.",
  },
  DOCUMENTALISTE: {
    icon: BookText,
    label: "Documentaliste",
    description: "Gère et modère les mémoires de la bibliothèque.",
  },
  ETUDIANT: {
    icon: GraduationCap,
    label: "Étudiant",
    description: "Consulte les mémoires et peut soumettre les siens.",
  },
  PUBLIC: {
    icon: Globe,
    label: "Public",
    description: "Visiteur : consultation des mémoires validés uniquement.",
  },
};

const getRole = (role?: string): RoleMeta => ROLES[role ?? ""] ?? ROLES.PUBLIC;

const STATUS = {
  actif: {
    icon: CircleCheck,
    label: "Compte actif",
    description: "L'utilisateur peut se connecter et utiliser l'application.",
    tone: "text-[#86efac]",
  },
  inactif: {
    icon: CircleX,
    label: "Compte inactif",
    description: "L'utilisateur ne peut plus se connecter.",
    tone: "text-red-600",
  },
};

/* ------------------------------------------------------------------ */
/*  Tooltip : survol sur PC, tap sur mobile                            */
/* ------------------------------------------------------------------ */

function IconTip({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        onClick={() => {
          /* Sur écran tactile (pas de hover), un tap ouvre la bulle ;
             un tap ailleurs la ferme via onOpenChange. */
          if (window.matchMedia("(hover: none)").matches) setOpen(true);
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 space-y-0.5">
        <p className="font-medium">{label}</p>
        <p className="opacity-80">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
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

  /* Modales */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      /* Page vidée : on revient à la précédente */
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err: any) {
      console.error("delete user error:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
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
      toast.success(`Le rôle de ${userToModifyRole.prenom} a été mis à jour en ${selectedRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userToModifyRole.id ? { ...u, role: selectedRole as any } : u))
      );
      setIsRoleDialogOpen(false);
    } catch (err: any) {
      console.error("update role error:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour du rôle");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="font-bold text-xl">Accès refusé</h3>
        <p className="text-muted-foreground text-sm">Seul un administrateur peut accéder à cette page de gestion.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* En-tête + recherche */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">Utilisateurs</h1>
              {!isLoading && <Badge variant="outline">{total}</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">
              Consultez les comptes, changez les rôles d'accès ou supprimez un compte.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 md:w-96">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Nom, prénom ou email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Rechercher</Button>
          </form>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24" aria-busy="true">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white py-16 text-center text-neutral-900">
            <SearchX className="h-8 w-8 text-neutral-400" />
            <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
            <p className="text-sm text-neutral-500">Essayez avec un autre nom ou une autre adresse email.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div
              key={`${page}-${search}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {users.map((u) => {
                  const role = getRole(u.role);
                  const RoleIcon = role.icon;
                  const status = u.isActif !== false ? STATUS.actif : STATUS.inactif;
                  const StatusIcon = status.icon;
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <motion.div key={u.id} variants={cardVariants} layout exit="exit">
                      <Card className="flex h-full flex-col gap-4 p-5">
                        {/* En-tête : identité + menu d'actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold uppercase text-primary">
                              {u.prenom?.[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-sm font-semibold">
                                  {u.prenom} {u.nom}
                                </span>
                                {isSelf && (
                                  <Badge variant="outline">Vous</Badge>
                                )}
                              </div>
                              <p className="truncate text-xs font-medium text-neutral-300">{u.email}</p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              type="button"
                              aria-label={`Actions pour ${u.prenom} ${u.nom}`}
                              className="-mr-1.5 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-500 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-neutral-100"
                            >
                              <Ellipsis className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem disabled={isSelf} onClick={() => handleOpenRoleChange(u)}>
                                <Shield className="size-4" />
                                Modifier le rôle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() => handleOpenDelete(u)}
                              >
                                <Trash2 className="size-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Pied : rôle + statut (icônes avec tooltip) et date */}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          <div className="flex items-center gap-1.5">
                            <IconTip label={role.label} description={role.description} className="text-primary">
                              <RoleIcon className="size-4" />
                            </IconTip>
                            <IconTip label={status.label} description={status.description} className={status.tone}>
                              <StatusIcon className="size-4" />
                            </IconTip>
                          </div>
                          <span className="text-xs text-neutral-500">
                            Inscrit le {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  {users.length} sur {total} utilisateurs
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Page précédente"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm font-medium tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Page suivante"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dialog : suppression */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <DialogTitle>Supprimer le compte</DialogTitle>
              </div>
              <DialogDescription>
                Voulez-vous vraiment supprimer{" "}
                <span className="font-semibold text-foreground">
                  {userToDelete?.prenom} {userToDelete?.nom} ({userToDelete?.email})
                </span>{" "}
                ? Cette action est définitive.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-1">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog : changement de rôle */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Shield className="size-5 text-primary" />
                </div>
                <DialogTitle>Modifier le rôle</DialogTitle>
              </div>
              <DialogDescription>
                Choisissez les privilèges de{" "}
                <span className="font-semibold text-foreground">
                  {userToModifyRole?.prenom} {userToModifyRole?.nom}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <label className="text-sm font-medium">Nouveau rôle</label>
              <Select
                value={selectedRole}
                onValueChange={(val: string | null) => val && setSelectedRole(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && (
                <p className="text-xs text-muted-foreground">{getRole(selectedRole).description}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-1">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)} disabled={isUpdatingRole}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole || selectedRole === userToModifyRole?.role}
              >
                {isUpdatingRole ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}