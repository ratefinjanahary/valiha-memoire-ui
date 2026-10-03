import { Memoire } from "@/types/memoire";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, GraduationCap, Building2 } from "lucide-react";

interface MemoireCardProps {
  memoire: Memoire;
  onClick?: (id: string) => void;
}

export function MemoireCard({ memoire, onClick }: MemoireCardProps) {
  return (
    <Card 
      className="flex flex-col h-full overflow-hidden transition-all duration-300 cursor-pointer group"
      onClick={() => onClick && onClick(memoire.id)}
    >
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="secondary" className="font-medium bg-primary/10 text-primary hover:bg-primary/20">
            {memoire.typeDiplome}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            {memoire.anneeSoutenance}
          </div>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {memoire.titre}
        </h3>
        <div className="text-sm text-muted-foreground flex items-center mt-1">
          <GraduationCap className="w-4 h-4 mr-2" />
          {memoire.auteurPrenom} {memoire.auteurNom}
        </div>
      </CardHeader>
      
      <CardContent className="py-4 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {memoire.resume || "Aucun résumé disponible."}
        </p>
      </CardContent>
      
      <CardFooter className="pt-0 pb-4 flex flex-col items-start gap-3">
        {/* Informations institutionnelles */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {memoire.universite && (
            <div className="flex items-center bg-muted px-2 py-1 rounded-md">
              <Building2 className="w-3 h-3 mr-1" />
              <span className="truncate max-w-30" title={memoire.universite.nom}>
                {memoire.universite.sigle || memoire.universite.nom}
              </span>
            </div>
          )}
          {memoire.domaine && (
            <div className="flex items-center bg-muted px-2 py-1 rounded-md">
              <BookOpen className="w-3 h-3 mr-1" />
              <span className="truncate max-w-30" title={memoire.domaine.nom}>
                {memoire.domaine.nom}
              </span>
            </div>
          )}
        </div>
        
        {/* Mots-clés */}
        {memoire.motsCles && memoire.motsCles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {memoire.motsCles.slice(0, 3).map((mc, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] font-normal border-muted-foreground/20">
                {mc.motCle.libelle}
              </Badge>
            ))}
            {memoire.motsCles.length > 3 && (
              <Badge variant="outline" className="text-[10px] font-normal border-muted-foreground/20">
                +{memoire.motsCles.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
