"use client";

import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check, Loader2, AlertTriangle,
  Calendar, GraduationCap, FileText, ExternalLink, Pencil, Trash2,
  Eye, Clock, CheckCircle2, XCircle, PencilLine, MoreVertical
} from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import { Memoire, StatutMemoire } from "@/types/memoire";
import { EditMemoireDialog, getApiErrorMessage } from "@/components/memoires/edit-memoire-dialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type StatutFilter = StatutMemoire | "TOUS";

const FILTERS: { value: StatutFilter; label: string }[] = [
  { value: "EN_ATTENTE_MODERATION", label: "En attente" },
  { value: "REJETTE", label: "Rejetés" },
  { value: "VALIDE", label: "Validés" },
  { value: "BROUILLON", label: "Brouillons" },
  { value: "TOUS", label: "Tous" },
];

// Une seule apparence pour tous les badges : le statut se distingue par son icône
const STATUT_BADGE: Record<StatutMemoire, { label: string; Icon: LucideIcon }> = {
  BROUILLON: { label: "Brouillon", Icon: PencilLine },
  EN_ATTENTE_MODERATION: { label: "En attente", Icon: Clock },
  VALIDE: { label: "Validé", Icon: CheckCircle2 },
  REJETTE: { label: "Rejeté", Icon: XCircle },
};

const EMPTY_MESSAGES: Record<StatutFilter, string> = {
  EN_ATTENTE_MODERATION: "Tous les mémoires soumis ont été modérés. Bon travail !",
  REJETTE: "Aucun mémoire rejeté pour le moment.",
  VALIDE: "Aucun mémoire validé pour le moment.",
  BROUILLON: "Aucun brouillon pour le moment.",
  TOUS: "Aucun mémoire enregistré pour le moment.",
};

export default function ModerationPage() {
  const [memoires, setMemoires] = useState<Memoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("EN_ATTENTE_MODERATION");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedMemoireId, setSelectedMemoireId] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState("");

  const [memoireToEdit, setMemoireToEdit] = useState<Memoire | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  /* State et badge de la vue détails */
  const [memoireToView, setMemoireToView] = useState<Memoire | null>(null);

  const [memoireToDelete, setMemoireToDelete] = useState<Memoire | null>(null);


  // Ignore les réponses obsolètes quand on change vite de filtre/page
  const requestId = useRef(0);

  const fetchMemoires = async () => {
    const current = ++requestId.current;
    setIsLoading(true);
    try {
      const response = await memoireService.getModerationList({
        statut: statutFilter === "TOUS" ? undefined : statutFilter,
        page,
      });
      if (current !== requestId.current) return;
      setMemoires(response.data ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (err: any) {
      if (current !== requestId.current) return;
      console.error("fetch memoires:", err);
      toast.error("Erreur lors de la récupération des mémoires");
    } finally {
      if (current === requestId.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statutFilter]);

  const changeFilter = (value: StatutFilter) => {
    if (value === statutFilter) return;
    setStatutFilter(value);
    setPage(1);
  };

  const handleValidate = async (id: string) => {
    setSubmittingId(id);
    try {
      await memoireService.updateStatus(id, "VALIDE");
      toast.success("Le mémoire a été validé avec succès");
      await fetchMemoires();
    } catch (err: any) {
      console.error("validate memoire:", err);
      toast.error(getApiErrorMessage(err, "Erreur lors de la validation du mémoire"));
    } finally {
      setSubmittingId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedMemoireId(id);
    setMotifRejet("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedMemoireId) return;
    if (!motifRejet.trim()) {
      toast.error("Le motif de rejet est requis");
      return;
    }

    setSubmittingId(selectedMemoireId);
    setIsRejectDialogOpen(false);
    try {
      await memoireService.updateStatus(selectedMemoireId, "REJETTE", motifRejet);
      toast.success("Le mémoire a été rejeté");
      await fetchMemoires();
    } catch (err: any) {
      console.error("reject memoire:", err);
      toast.error(getApiErrorMessage(err, "Erreur lors du rejet du mémoire"));
    } finally {
      setSubmittingId(null);
      setSelectedMemoireId(null);
    }
  };

  const openEditDialog = (memoire: Memoire) => {
    setMemoireToEdit(memoire);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memoireToDelete) return;
    const { id } = memoireToDelete;

    setSubmittingId(id);
    setMemoireToDelete(null);
    try {
      await memoireService.remove(id);
      toast.success("Le mémoire a été supprimé");
      // Dernière carte de la page : on recule d'une page (l'effet recharge la liste)
      if (memoires.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchMemoires();
      }
    } catch (err: any) {
      console.error("delete memoire:", err);
      toast.error(getApiErrorMessage(err, "Erreur lors de la suppression du mémoire"));
    } finally {
      setSubmittingId(null);
    }
  };

  const viewBadge = memoireToView ? STATUT_BADGE[memoireToView.statut] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Modération des Mémoires</h1>
        <p className="text-muted-foreground text-sm">
          Validez, rejetez, modifiez ou supprimez les mémoires. Seuls les mémoires validés sont visibles par le public,
          et un mémoire validé ne peut plus être modifié ni supprimé.
        </p>
      </div>

      {/* Filtre par statut */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statutFilter === f.value ? "secondary" : "outline"}
            onClick={() => changeFilter(f.value)}
            className="px-4"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Liste des mémoires */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : memoires.length === 0 ? (
        <div className="text-center py-24 border rounded-md flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-green-400/15 text-green-400 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Aucun mémoire</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">{EMPTY_MESSAGES[statutFilter]}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memoires.map((memoire) => {
              const { label, Icon } = STATUT_BADGE[memoire.statut];
              const isValide = memoire.statut === "VALIDE";
              const canModerate = memoire.statut === "EN_ATTENTE_MODERATION";
              const canRevalidate = memoire.statut === "REJETTE";

              return (
                <Card key={memoire.id} className="overflow-hidden flex flex-col h-full">
                  <div className="flex-1 p-3 flex flex-col">
                    <div>
                      {/* Statut, tags et année */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-semibold gap-1">
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </Badge>
                        <Badge variant="outline" className="font-semibold lowercase">
                          {memoire.typeDiplome}
                        </Badge>
                        {memoire.universite && (
                          <Badge variant="outline" className="font-semibold">
                            {memoire.universite.sigle}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {memoire.anneeSoutenance}
                        </div>
                      </div>

                      {/* Titre */}
                      <h3 className="font-bold text-md text-foreground line-clamp-1 mb-2">{memoire.titre}</h3>

                      {/* Auteur */}
                      <div className="text-sm text-muted-foreground flex items-center mb-4">
                        <GraduationCap className="w-4 h-4 mr-2 text-primary" />
                        <span>
                          Auteur :{" "}
                          <strong className="text-foreground">
                            {memoire.auteurPrenom} {memoire.auteurNom}
                          </strong>
                        </span>
                      </div>
                    </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t flex items-center justify-between gap-2">
                    {memoire.pdfUrl ? (
                      <a
                        href={memoire.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center min-w-0 text-xs font-semibold text-primary hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span className="truncate">Voir le document PDF</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Aucun fichier PDF rattaché</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {(canModerate || canRevalidate) && (
                        <Button
                          className="px-3.5"
                          size="sm"
                          disabled={submittingId !== null}
                          onClick={() => handleValidate(memoire.id)}
                        >
                          {submittingId === memoire.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : canRevalidate ? (
                            "Revalider"
                          ) : (
                            "Valider"
                          )}
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" title="Actions" disabled={submittingId !== null}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setMemoireToView(memoire)}>
                            <Eye className="w-4 h-4" /> Détails
                          </DropdownMenuItem>

                          {canModerate && (
                            <DropdownMenuItem onClick={() => openRejectDialog(memoire.id)}>
                              <XCircle className="w-4 h-4" /> Rejeter
                            </DropdownMenuItem>
                          )}

                          {!isValide && (
                            <>
                              <DropdownMenuItem onClick={() => openEditDialog(memoire)}>
                                <Pencil className="w-4 h-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setMemoireToDelete(memoire)}>
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination simple si applicable */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogue de modification */}
      <EditMemoireDialog
        memoire={memoireToEdit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={fetchMemoires}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={memoireToDelete !== null} onOpenChange={(o) => !o && setMemoireToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Supprimer le mémoire</DialogTitle>
            </div>
            <DialogDescription>
              « {memoireToDelete?.titre} » sera supprimé définitivement, avec son fichier PDF. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemoireToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de motif de rejet */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Rejeter le mémoire</DialogTitle>
            </div>
            <DialogDescription>
              Veuillez saisir le motif du rejet. Ce motif sera enregistré et envoyé à l&apos;utilisateur ayant soumis le
              mémoire.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Exemple : Le document ne respecte pas les normes de mise en page ou contient des informations incomplètes..."
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              className="min-h-[100px] w-full"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!motifRejet.trim()}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memoireToView !== null} onOpenChange={(o) => !o && setMemoireToView(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {memoireToView && viewBadge && (
            <>
              <DialogHeader className="space-y-2">
                <Badge variant="outline" className="font-semibold gap-1 w-fit">
                  <viewBadge.Icon className="w-3.5 h-3.5" />
                  {viewBadge.label}
                </Badge>
                <DialogTitle className="leading-snug">{memoireToView.titre}</DialogTitle>
                <DialogDescription>
                  {memoireToView.auteurPrenom} {memoireToView.auteurNom}
                </DialogDescription>
              </DialogHeader>

              {memoireToView.statut === "REJETTE" && memoireToView.motifRejet && (
                <div className="bg-destructive/5 border border-destructive/5 p-3 rounded-md text-sm text-destructive">
                  <p className="mb-0.5 flex items-center">
                    <XCircle className="w-4 h-4 mr-1.5" /> Motif du rejet :
                  </p>
                  {memoireToView.motifRejet}
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground border border-muted">
                <p className="font-semibold text-foreground/80 mb-1 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5" /> Résumé :
                </p>
                {memoireToView.resume || "Aucun résumé fourni."}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}