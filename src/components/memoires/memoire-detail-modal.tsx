"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, GraduationCap, Building2, BookOpen, 
  UserCheck, ChevronRight, Eye, Network, SquareArrowOutUpRight
} from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import { Memoire } from "@/types/memoire";

import {
  Dialog,DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "../ui/spinner";

interface MemoireDetailModalProps {
  memoireId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemoireDetailModal({ memoireId, isOpen, onClose }: MemoireDetailModalProps) {
  const router = useRouter();
  const [memoire, setMemoire] = useState<Memoire | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && memoireId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const data = await memoireService.getById(memoireId);
          setMemoire(data);
        } catch (err) {
          console.error("Erreur de récupération du mémoire:", err);
          toast.error("Impossible de charger les détails du mémoire");
          onClose();
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    } else {
      setMemoire(null);
    }
  }, [isOpen, memoireId, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner className="h-7 w-7 text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des détails du mémoire...</p>
          </div>
        ) : memoire ? (
          <>
            <DialogHeader className="px-6 py-5 border-b bg-muted/20 relative">
              <div className="flex flex-wrap gap-2 mb-2 items-center">
                <Badge variant="secondary" className="font-semibold lowercase bg-primary/10 text-primary hover:bg-primary/20">
                  {memoire.typeDiplome}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground mr-4">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {memoire.anneeSoutenance}
                </div>
                {memoire.nbConsultations !== undefined && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {memoire.nbConsultations} vue{memoire.nbConsultations > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-foreground leading-tight tracking-tight pr-6">
                {memoire.titre}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Auteur et Université */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auteur</h4>
                      <p className="text-sm font-medium text-foreground">
                        {memoire.auteurPrenom} {memoire.auteurNom}
                      </p>
                    </div>
                  </div>
                  {memoire.universite && (
                    <div className="flex items-start gap-2.5">
                      <Building2 className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Université</h4>
                        <p className="text-sm font-medium text-foreground" title={memoire.universite.nom}>
                          {memoire.universite.nom} ({memoire.universite.sigle})
                        </p>
                      </div>
                    </div>
                  )}
                  {memoire.domaine && (
                    <div className="flex items-start gap-2.5 md:col-span-2 border-t pt-3 mt-1">
                      <BookOpen className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domaine</h4>
                        <p className="text-sm font-medium text-foreground">
                          {memoire.domaine.nom}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Encadreurs */}
                {memoire.encadreurs && memoire.encadreurs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center">
                      <UserCheck className="w-4 h-4 mr-1.5 text-primary" />
                      Encadreur(s)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {memoire.encadreurs.map((e, idx) => (
                        <div key={idx} className="text-sm p-2.5 border rounded-md bg-card/50">
                          <p className="font-medium text-foreground">
                            {e.encadreur.titre ? `${e.encadreur.titre} ` : ""}
                            {e.encadreur.prenom} {e.encadreur.nom}
                          </p>
                          {e.role && (
                            <p className="text-xs text-muted-foreground">{e.role}</p>
                          )}
                          {e.encadreur.email && (
                            <p className="text-xs text-primary/80 mt-0.5 truncate">{e.encadreur.email}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Résumé */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Résumé</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed p-4 border rounded-lg bg-card text-justify whitespace-pre-line">
                    {memoire.resume || "Aucun résumé disponible pour ce mémoire."}
                  </div>
                </div>

                {/* Mots Clés */}
                {memoire.motsCles && memoire.motsCles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Mots-clés</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {memoire.motsCles.map(({ motCle }) =>
                        motCle.isUnesco && motCle.unescoUri ? (
                          <a
                            key={motCle.id}
                            href={motCle.unescoUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Descripteur du Thésaurus de l'UNESCO"
                          >
                            <Badge variant="violet-outline" className="text-xs font-normal gap-1 px-2.5 py-1 hover:bg-secondary/70">
                              {motCle.libelle}
                              <SquareArrowOutUpRight className="w-3 h-3" />
                            </Badge>
                          </a>
                        ) : (
                          <Badge key={motCle.id} variant="outline" className="text-xs font-normal border-muted-foreground/30 px-2.5 py-1">
                            {motCle.libelle}
                          </Badge>
                        ),
                      )}
                    </div>
                    {memoire.motsCles.some(({ motCle }) => motCle.isUnesco) && (
                      <p className="text-[11px] text-muted-foreground">
                        Les mots-clés avec icône sont des descripteurs du Thésaurus de l'UNESCO.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="sm:flex-1">
                {memoire.pdfUrl && (
                  <a
                    href={memoire.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    <SquareArrowOutUpRight className="mr-2 h-4 w-4 shrink-0" />
                    Consulter le PDF
                  </a>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push(`/graph?focus=mem_${memoire.id}`);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Network className="mr-2 h-4 w-4" />
                  Voir dans le graphe
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Fermer
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            Erreur lors de la récupération des informations du mémoire.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}