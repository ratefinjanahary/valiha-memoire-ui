"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { isAxiosError } from "axios";
import { ChevronLeft, ChevronRight, ScrollText, Trash2 } from "lucide-react";

import {
  analyticsService,
  type AuditLog,
  type AuditMeta,
} from "@/services/analytics.service";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* Helpers */

// "USER_LOGIN" -> "User login" (le code brut reste visible au survol)
function formatAction(action: string) {
  const text = action.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Couleur du badge déduite du nom de l'action (purement cosmétique)
function actionVariant(action: string): "default" | "secondary" | "destructive" {
  const a = action.toUpperCase();
  if (/(DELETE|SUPPR|REJECT|REJET|FAIL|ECHEC|DENIED)/.test(a)) return "destructive";
  if (/(CREATE|SUBMIT|VALID|APPROV|LOGIN|REGISTER)/.test(a)) return "default";
  return "secondary";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* -------------------------------------------------------------------------- */
/*  Composant                                                                 */
/* -------------------------------------------------------------------------- */

export function AuditLogsTable() {
  const reduceMotion = useReducedMotion();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ids en attente de confirmation de suppression
  const [pending, setPending] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async (targetPage: number) => {
    setIsFetching(true);
    try {
      const res = await analyticsService.getAuditLogs(targetPage);

      // La page courante est vide après suppression : on recule d'une page
      if (res.data.length === 0 && targetPage > 1) {
        setPage(targetPage - 1);
        return;
      }

      setLogs(res.data);
      setMeta(res.meta);
      setSelected(new Set());
      setError(null);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setForbidden(true); // pas ADMIN : la section disparaît
      } else {
        console.error("Erreur chargement audit logs", err);
        setError("Impossible de charger le journal d'audit.");
      }
    } finally {
      setIsFetching(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => { void load(page); }, [page, load]);

  /* Sélection */
  const allSelected = logs.length > 0 && logs.every((l) => selected.has(l.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(logs.map((l) => l.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /* ----------------------------- Suppression ------------------------------ */

  async function confirmDelete() {
    if (!pending) return;
    const ids = pending;
    setIsDeleting(true);
    try {
      if (ids.length === 1) await analyticsService.deleteAuditLog(ids[0]);
      else await analyticsService.deleteAuditLogs(ids);

      // Retrait local immédiat : déclenche l'animation de sortie des lignes
      setLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
      setSelected(new Set());
      setPending(null);

      // Puis resynchronisation (totaux, ligne qui remonte depuis la page suivante)
      await load(page);
    } catch (err) {
      console.error("Erreur suppression audit logs", err);
      setError("La suppression a échoué. Réessayez.");
      setPending(null);
    } finally {
      setIsDeleting(false);
    }
  }

  /* ------------------------------ Animation ------------------------------- */

  // Entrée en cascade des lignes, déclenchée quand elles deviennent visibles
  // (le tableau est en bas du dashboard : une animation au montage serait
  // jouée hors écran). Désactivée si l'utilisateur préfère moins de mouvement.
  const rowVariants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: reduceMotion ? 0 : i * 0.05,
        duration: reduceMotion ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    exit: {
      opacity: 0,
      x: reduceMotion ? 0 : -24,
      transition: { duration: 0.2 },
    },
  };

  /* -------------------------------- Rendu --------------------------------- */

  if (forbidden) return null;

  const pendingCount = pending?.length ?? 0;

  return (
    <Card className="border-muted">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Journal d&apos;audit</CardTitle>
          <CardDescription>
            {meta
              ? `${meta.total.toLocaleString("fr-FR")} actions enregistrées sur la plateforme.`
              : "Historique des actions effectuées sur la plateforme."}
          </CardDescription>
        </div>

        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setPending([...selected])}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer ({selected.size})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {isInitialLoad ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-5 w-5 text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
            <ScrollText className="h-6 w-6" />
            Aucune action enregistrée pour le moment.
          </div>
        ) : (
          <>
            <div
              className={`rounded-lg border transition-opacity ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onCheckedChange={(checked) => toggleAll(checked)}
                        aria-label="Tout sélectionner sur cette page"
                        
                      />
                    </TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="hidden md:table-cell">Détails</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Supprimer</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  <AnimatePresence initial={false}>
                    {logs.map((log, index) => {
                      const isSelected = selected.has(log.id);
                      return (
                        // motion.tr (et non motion(TableRow)) : indépendant de la
                        // version de framer-motion ; mêmes classes que TableRow.
                        <motion.tr
                          key={log.id}
                          custom={index}
                          variants={rowVariants}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true, amount: 0.3 }}
                          exit="exit"
                          data-state={isSelected ? "selected" : undefined}
                          className="transition-colors last:border-b-0 hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(c) => toggleOne(log.id, c === true)}
                              aria-label={`Sélectionner l'action ${formatAction(log.action)}`}
                            />
                          </TableCell>

                          <TableCell>
                            <Badge variant={actionVariant(log.action)} title={log.action}>
                              {formatAction(log.action)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {log.user ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {log.user.prenom} {log.user.nom}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {log.user.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Système ou compte supprimé
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="hidden max-w-xs md:table-cell">
                            <span
                              className="block truncate text-sm text-muted-foreground"
                              title={log.details ?? undefined}
                            >
                              {log.details || "—"}
                            </span>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </TableCell>

                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setPending([log.id])}
                              aria-label="Supprimer cette entrée"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} sur {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Confirmation (suppression unitaire ou groupée) */}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingCount > 1
                ? `Supprimer ${pendingCount} entrées du journal ?`
                : "Supprimer cette entrée du journal ?"}
            </DialogTitle>
            <DialogDescription>
              Cette action est définitive. Seule la suppression elle-même sera
              conservée dans le journal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setPending(null)}
            >
              Annuler
            </Button>
            <Button
              className={buttonVariants({ variant: "destructive" })}
              disabled={isDeleting}
              onClick={() => {
                void confirmDelete();
              }}
            >
              {isDeleting && <Spinner className="h-4 w-4" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}