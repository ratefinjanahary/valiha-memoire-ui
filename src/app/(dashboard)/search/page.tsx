"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { searchService, TrendingKeyword } from "@/services/search.service";
import { Memoire } from "@/types/memoire";
import { MemoireCard } from "@/components/memoires/MemoireCard";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Memoire[]>([]);
  const [trending, setTrending] = useState<TrendingKeyword[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Charger les mots-clés tendances au montage
  useEffect(() => {
    async function loadTrending() {
      try {
        const data = await searchService.getTrendingKeywords(15);
        setTrending(data);
      } catch (error) {
        console.error("Erreur lors du chargement des tendances", error);
      }
    }
    loadTrending();
  }, []);

  const handleSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await searchService.searchSemantic(query);
      setResults(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la recherche sémantique");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    // On ne lance pas automatiquement pour laisser l'utilisateur formuler une phrase s'il le souhaite
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section pour la recherche Sémantique */}
      <div className="text-center space-y-4 py-8 px-4 rounded-3xl bg-linear-to-b from-primary/10 to-background border">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center rotate-3">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Recherche Sémantique</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Posez votre question naturellement. Notre IA Google analysera le sens de votre requête 
          pour trouver les mémoires les plus pertinents.
        </p>

        <form onSubmit={handleSemanticSearch} className="max-w-2xl mx-auto mt-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ex: Quel est l'impact de l'IA sur l'éducation à Madagascar ?"
              className="pl-12 h-12 text-base rounded-full shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="rounded-full px-8 h-12 shadow-sm" disabled={isSearching || !query.trim()}>
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Rechercher"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Colonne de gauche : Mots-clés tendances */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center text-muted-foreground uppercase tracking-wider">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                Tendances Actuelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trending.length > 0 ? (
                  trending.map((t) => (
                    <Badge 
                      key={t.motCleId} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => handleKeywordClick(t.libelle)}
                    >
                      {t.libelle}
                      <span className="ml-1 opacity-50 text-[10px]">({t.count})</span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chargement des tendances...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne de droite : Résultats */}
        <div className="order-1 lg:order-2 lg:col-span-3 min-h-100">
          {!hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border rounded-2xl bg-card/50 border-dashed text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-4 opacity-20" />
              <p>Formulez une question complexe pour voir la magie opérer.</p>
            </div>
          ) : isSearching ? (
            <div className="h-full flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">Analyse vectorielle en cours...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border rounded-2xl bg-card/50 border-dashed">
              <p className="text-muted-foreground">Aucun résultat sémantique trouvé pour cette requête.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm mr-3">
                  {results.length} résultats
                </span>
                Les plus pertinents selon l'IA
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {results.map((memoire, index) => (
                  <motion.div 
                    key={memoire.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MemoireCard 
                      memoire={memoire} 
                      onClick={(id) => toast.info(`Détails du mémoire ${id} à implémenter`)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
