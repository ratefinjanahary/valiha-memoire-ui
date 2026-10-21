"use client";

import { Calendar, GraduationCap, Building2, BookOpen } from "lucide-react";

import { Memoire } from "@/types/memoire";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface MemoireCardProps {
  memoire: Memoire;
  onClick: () => void;
}

export function MemoireCard({ memoire, onClick }: MemoireCardProps) {

  const capitalize = (str?: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  const relevancePercent =
    memoire.jaccardScore != null ? Math.round(memoire.jaccardScore * 100) : null;

    const truncateWords = (text: string, maxWords: number) => {
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(" ") + "…";
    };

  return (
    <Card
      className="flex flex-col h-full overflow-hidden transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-1 border-b">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary hover:bg-primary/20">
            {capitalize(memoire.typeDiplome)}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            {memoire.anneeSoutenance}
          </div>
        </div>
        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
          {memoire.titre}
        </h3>
        <div className="text-sm text-muted-foreground flex items-center mt-1">
          <GraduationCap className="w-4 h-4 mr-2" />
          {memoire.auteurPrenom} {memoire.auteurNom}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">
          {memoire.resume
          ? truncateWords(memoire.resume, 12)
          : "Aucun résumé disponible."}
        </p>
      </CardContent>

      <CardFooter className="pt-0 pb-4 flex flex-col items-start gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {memoire.universite && (
            <Badge variant="outline" className="py-3">
              <Building2 className="w-3 h-3 mr-1" />
              <span className="truncate max-w-30" title={memoire.universite.nom}>
                {memoire.universite.sigle || memoire.universite.nom}
              </span>
            </Badge>
          )}
          {memoire.domaine && (
            <Badge variant="outline" className="py-3">
              <BookOpen className="w-3 h-3 mr-1" />
              <span className="truncate max-w-30" title={memoire.domaine.nom}>
                {memoire.domaine.nom}
              </span>
            </Badge>
          )}
        </div>

        {memoire.motsCles && memoire.motsCles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {memoire.motsCles.slice(0, 3).map((mc, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] font-normal border-muted-foreground/20">
                {mc.motCle?.libelle}
              </Badge>
            ))}
            {memoire.motsCles.length > 3 && (
              <Badge variant="outline" className="text-[10px] font-normal border-muted-foreground/20">
                +{memoire.motsCles.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Uniquement en recherche sémantique (jaccardScore présent) */}
        {relevancePercent !== null && (
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Pertinence sémantique</span>
              <span className="font-medium text-foreground">{relevancePercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${relevancePercent}%` }} />
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}