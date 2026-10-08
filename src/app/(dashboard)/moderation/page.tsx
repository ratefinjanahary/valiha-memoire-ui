"use client";

import { useState, useEffect } from "react";
import { 
  Check, X, Loader2, AlertTriangle, 
  Calendar, GraduationCap, FileText, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import { Memoire } from "@/types/memoire";

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
import { Textarea } from "@/components/ui/textarea";

export default function ModerationPage() {
  const [memoires, setMemoires] = useState<Memoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // States pour la modale de rejet
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedMemoireId, setSelectedMemoireId] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState("");

  const fetchPendingMemoires = async (currentPage = page) => {
    setIsLoading(true);
    try {
      const response = await memoireService.getPending(currentPage);
      // getPending retourne `data` et `meta`
      setMemoires((response as any).data ?? []);
      setTotalPages((response as any).meta?.totalPages ?? 1);
    } catch (err: any) {
      console.error("fetch pending:", err);
      toast.error("Erreur lors de la récupération des mémoires en attente");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMemoires(page);
  }, [page]);

  const handleValidate = async (id: string) => {
    setSubmittingId(id);
    try {
      await memoireService.updateStatus(id, "VALIDE");
      toast.success("Le mémoire a été validé avec succès");
      setMemoires((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error("validate memoire:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la validation du mémoire");
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
      // Mettre à jour la liste locale
      setMemoires((prev) => prev.filter((m) => m.id !== selectedMemoireId));
    } catch (err: any) {
      console.error("reject memoire:", err);
      toast.error(err.response?.data?.message || "Erreur lors du rejet du mémoire");
    } finally {
      setSubmittingId(null);
      setSelectedMemoireId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Modération des Mémoires</h1>
        <p className="text-muted-foreground text-sm">
          Validez ou rejetez les mémoires en attente de modération. Les mémoires validés seront visibles par le public.
        </p>
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
            <h3 className="font-semibold text-lg">Aucun mémoire en attente</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Tous les mémoires soumis ont été modérés. Bon travail !
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols lg:grid-cols-3 gap-6">
            {memoires.map((memoire) => (
              <Card key={memoire.id} className="overflow-hidden flex flex-col h-full">
                <div className="flex-1 p-6 flex flex-col">
                  <div>
                    {/* Tags et Année */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary" className="font-semibold lowercase bg-primary/10 text-primary">
                        {memoire.typeDiplome}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {memoire.anneeSoutenance}
                      </div>
                      {memoire.universite && (
                        <Badge variant="outline" className="text-xs">
                          {memoire.universite.nom} ({memoire.universite.sigle})
                        </Badge>
                      )}
                    </div>

                    {/* Titre */}
                    <h3 className="font-bold text-md text-foreground mb-2">
                      {memoire.titre}
                    </h3>

                    {/* Auteur */}
                    <div className="text-sm text-muted-foreground flex items-center mb-4">
                      <GraduationCap className="w-4 h-4 mr-2 text-primary" />
                      <span>
                        Auteur : <strong className="text-foreground">{memoire.auteurPrenom} {memoire.auteurNom}</strong>
                      </span>
                    </div>

                    {/* Résumé */}
                    <div className="bg-muted/50 p-4 rounded-md mb-4 text-sm text-muted-foreground max-h-40 overflow-y-auto border border-muted">
                      <p className="font-semibold text-foreground/80 mb-1 flex items-center">
                        <FileText className="w-4 h-4 mr-1.5" /> Résumé :
                      </p>
                      {memoire.resume || "Aucun résumé fourni."}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 mt-auto pt-4 border-t">
                    {/* Document PDF si URL fournie */}
                    <div>
                      {(memoire as any).pdfUrl ? (
                        <a
                          href={(memoire as any).pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Voir le document PDF
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Aucun fichier PDF rattaché</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={submittingId !== null}
                        onClick={() => openRejectDialog(memoire.id)}
                        className="flex-1"
                      >
                        Rejeter
                      </Button>
                      <Button
                        variant="default"
                        disabled={submittingId !== null}
                        onClick={() => handleValidate(memoire.id)}
                        className="flex-1"
                      >
                        {submittingId === memoire.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Valider
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
              Veuillez saisir le motif du rejet. Ce motif sera enregistré et envoyé à l'utilisateur ayant soumis le mémoire.
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
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!motifRejet.trim()}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}