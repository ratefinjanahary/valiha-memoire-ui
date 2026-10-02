"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import { Memoire } from "@/types/memoire";
import { MemoireCard } from "@/components/memoires/MemoireCard";
import { SubmitMemoireModal } from "@/components/memoires/SubmitMemoireModal";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MemoiresPage() {
  const [memoires, setMemoires] = useState<Memoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination et filtres
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState<'any' | 'all'>('any');

  useEffect(() => {
    fetchMemoires();
  }, [page, mode]); // Recharge quand la page ou le mode change

  const fetchMemoires = async (query = searchQuery) => {
    setIsLoading(true);
    try {
      const response = await memoireService.search({
        q: query,
        mode: mode,
        page: page,
      });
      setMemoires(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Erreur lors de la récupération des mémoires");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Retour à la première page
    fetchMemoires(searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mémoires</h1>
          <p className="text-muted-foreground">Consultez et recherchez parmi la base de connaissances.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Soumettre un mémoire
        </Button>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par mots-clés (ex: intelligence artificielle)..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                {mode === 'any' ? "Contient un des mots" : "Contient tous les mots"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMode('any')}>
                Contient au moins un mot (Any)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('all')}>
                Contient tous les mots (All)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="submit" disabled={isLoading}>
            Rechercher
          </Button>
        </form>
      </div>

      {/* Grille de Mémoires */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : memoires.length === 0 ? (
        <div className="text-center py-24 border rounded-xl bg-card/50 border-dashed">
          <p className="text-muted-foreground">Aucun mémoire trouvé correspondant à vos critères.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {memoires.map((memoire) => (
              <MemoireCard 
                key={memoire.id} 
                memoire={memoire} 
                onClick={(id) => toast.info(`Détails du mémoire ${id} à implémenter`)}
              />
            ))}
          </div>

          {/* Pagination simple */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Précédent
              </Button>
              <div className="flex items-center px-4 text-sm font-medium">
                Page {page} sur {totalPages}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de Soumission */}
      <SubmitMemoireModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchMemoires} 
      />
    </div>
  );
}
