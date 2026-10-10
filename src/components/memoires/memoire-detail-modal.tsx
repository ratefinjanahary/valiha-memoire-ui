"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Calendar, GraduationCap, Building2, 
  BookOpen, Download, UserCheck, ChevronRight, Eye, 
  Network
} from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import { Memoire } from "@/types/memoire";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MemoireDetailModalProps {
  memoireId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSimilar?: (id: string) => void;
}

export function MemoireDetailModal({ memoireId, isOpen, onClose, onSelectSimilar }: MemoireDetailModalProps) {
  const router = useRouter();
  const [memoire, setMemoire] = useState<Memoire | null>(null);
  const [similaires, setSimilaires] = useState<Memoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSimilaires, setIsLoadingSimilaires] = useState(false);

  useEffect(() => {
    if (isOpen && memoireId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const data = await memoireService.getById(memoireId);
          setMemoire(data);
          
          // Charger les mémoires similaires
          setIsLoadingSimilaires(true);
          try {
            const sim = await memoireService.getSimilaires(memoireId, 3);
            setSimilaires(sim);
          } catch (e) {
            console.error("Erreur chargement similaires:", e);
          } finally {
            setIsLoadingSimilaires(false);
          }

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
      setSimilaires([]);
    }
  }, [isOpen, memoireId, onClose]);

  const handleSelectSimilar = (id: string) => {
    if (onSelectSimilar) {
      onSelectSimilar(id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                      {memoire.motsCles.map((mc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs font-normal border-muted-foreground/30 px-2.5 py-1">
                          {mc.motCle.libelle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommandations de Mémoires Similaires */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-foreground">Mémoires similaires</h3>
                  {isLoadingSimilaires ? (
                    <div className="flex items-center space-x-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Recherche de mémoires connexes...</span>
                    </div>
                  ) : similaires.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun mémoire similaire trouvé.</p>
                  ) : (
                    <div className="space-y-2">
                      {similaires.map((sim) => (
                        <button
                          key={sim.id}
                          onClick={() => handleSelectSimilar(sim.id)}
                          className="w-full text-left p-3 border rounded-md hover:bg-muted/50 transition-colors flex items-center justify-between group"
                        >
                          <div className="space-y-1 pr-4">
                            <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {sim.titre}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {sim.auteurPrenom} {sim.auteurNom} • {sim.anneeSoutenance} • <span className="lowercase font-semibold text-primary">{sim.typeDiplome}</span>
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t bg-muted/20 flex flex-col sm:flex-row gap-2 justify-end">
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
              {memoire.pdfUrl && (
                <Button 
                  onClick={() => window.open(memoire.pdfUrl, "_blank", "noopener,noreferrer")} 
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Consulter le PDF
                </Button>
              )}
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
