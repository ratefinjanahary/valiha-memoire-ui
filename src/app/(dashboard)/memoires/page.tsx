"use client";

import { useState, useEffect } from "react";
import { 
  Search, ListCheck, Loader2, Plus
} from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import { Memoire } from "@/types/memoire";
import { MemoireCard } from "@/components/memoires/memoire-card";
import { SubmitMemoireModal } from "@/components/memoires/submit-memoire-modal";
import { MemoireDetailModal } from "@/components/memoires/memoire-detail-modal";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";


export default function MemoiresPage() {
  const [memoires, setMemoires] = useState<Memoire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemoireId, setSelectedMemoireId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState<'any' | 'all'>('any');

  const fetchMemoires = async (query = searchQuery, currentPage = page, currentMode = mode) => {
    setIsLoading(true);
    try {
      const response = await memoireService.search({ q: query, mode: currentMode, page: currentPage });
      setMemoires(response.data ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (err) {
      console.error("search memoires:", err);
      toast.error("Erreur lors de la récupération des mémoires");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoires(searchQuery, page, mode);
  }, [page, mode]);

  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchMemoires(searchQuery, 1, mode);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Mémoires</h1>
          <p className="text-muted-foreground text-sm">Consultez et recherchez parmi la base de connaissances.</p>
        </div>
        <Button size="lg" className="px-3" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Soumettre un mémoire
        </Button>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="border rounded-sm p-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par mots-clés (ex: intelligence artificielle)..."
              className="pl-9 py-4.5 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="py-4.5"
              render={<Button variant="outline" className="shrink-0" type="button" />}
            >
              <ListCheck className="mr-2 h-4 w-4" />
              {mode === 'any' ? "Contient un des mots" : "Contient tous les mots"}
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

          <Button type="submit" size="lg" variant="outline" disabled={isLoading} className="px-5">
            Rechercher
          </Button>
        </form>
      </div>

      {/* Grille de Mémoires */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      ) : memoires.length === 0 ? (
        <div className="text-center py-24 border rounded-md">
          <p className="text-muted-foreground">Aucun mémoire trouvé correspondant à vos critères.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {memoires.map((m) => (
              <MemoireCard
                key={m.id}
                memoire={m}
                onClick={() => {
                  setSelectedMemoireId(m.id);
                  setIsDetailOpen(true);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Précédent
              </Button>
              <div className="flex items-center px-4 text-sm">
                Page {page} sur {totalPages}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        onSuccess={() => {
          setSearchQuery("");
          setPage(1);
          fetchMemoires("", 1, mode);
        }}
      />

      {/* Modal de Détails / Consultation */}
      <MemoireDetailModal
        memoireId={selectedMemoireId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMemoireId(null);
        }}
      />
    </div>
  );
}
