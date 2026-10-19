"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronsUp, Search, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { searchService, TrendingKeyword } from "@/services/search.service";
import { Memoire } from "@/types/memoire";
import { MemoireCard } from "@/components/memoires/memoire-card";
import { MemoireDetailModal } from "@/components/memoires/memoire-detail-modal";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SemanticLoader } from "@/components/memoires/semantic-loader";
import * as v from "@/lib/motion-variants";

const pageStagger = v.stagger(0.1);
const heroStagger = v.stagger(0.1, 0.05);
const trendingStagger = v.stagger(0.04, 0.1);
const gridStagger = v.stagger(0.08);

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Memoire[]>([]);
  const [trending, setTrending] = useState<TrendingKeyword[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedMemoireId, setSelectedMemoireId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const data = await searchService.getTrendingKeywords(15);
        setTrending(data);
      } catch (error) {
        console.error("Erreur lors du chargement des tendances", error);
      }
    };
    loadTrending();
  }, []);

  const handleSemanticSearch = async (e?: React.SubmitEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await searchService.searchSemantic(query);
      setResults(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la recherche semantique");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
  };

  return (
    <motion.div
      variants={pageStagger}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={v.fadeUp} className="relative text-center py-8 px-4 rounded-lg">
        {/* Brume */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-6 left-1/2 h-56 w-full max-w-xl -translate-x-1/2 opacity-75"
        >
          <motion.div
            className="absolute left-[8%] top-2 h-44 w-44 rounded-full bg-primary/25 blur-3xl transform-gpu"
            animate={{ x: [0, 40, 15, 0], y: [0, 15, 30, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[8%] top-0 h-48 w-48 rounded-full bg-[oklch(0.5106_0.2301_330)]/20 blur-3xl transform-gpu"
            animate={{ x: [0, -35, -10, 0], y: [0, 20, -10, 0], scale: [1, 0.9, 1.15, 1] }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-1/2 bottom-0 -ml-20 h-36 w-40 rounded-full bg-primary/15 blur-3xl transform-gpu"
            animate={{ x: [0, 30, -30, 0], y: [0, -15, 10, 0], scale: [1, 1.2, 1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Contenu du hero */}
        <motion.div variants={heroStagger} className="relative z-10 space-y-4">
          <motion.div variants={v.iconPop} className="flex justify-center mb-4">
            <div className="h-16 w-16 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </motion.div>

          <motion.h1 variants={v.fadeUp} className="text-2xl font-semibold text-primary">
            Recherche Semantique
          </motion.h1>

          <motion.p variants={v.fadeUp} className="text-md text-muted-foreground max-w-2xl mx-auto">
            Posez votre question naturellement. Notre IA Google analysera le sens de votre requete
            pour trouver les memoires les plus pertinents.
          </motion.p>

          <motion.form variants={v.fadeUp} onSubmit={handleSemanticSearch} className="max-w-2xl mx-auto mt-8 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ex: Intelligence Artificielle..."
                className="pl-11 h-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="px-8 h-10 relative overflow-hidden group" disabled={isSearching || !query.trim()}>
              <motion.span
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "linear",
                  repeatDelay: 1,
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              />
              {isSearching ? (
                <span className="relative flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Analyse...
                </span>
              ) : (
                "Rechercher"
              )}
            </Button>
          </motion.form>
        </motion.div>
      </motion.div>

      {/* Bandeau tendances — sorti du grid des résultats */}
      <motion.section variants={v.fadeUp} className="rounded-md border px-5 py-4">
        <motion.div variants={v.slideInLeft} className="flex items-center gap-3 mb-3">
          <div className="bg-primary/10 text-primary p-1.5 rounded-sm">
            <ChevronsUp className="h-4 w-4 text-primary" />
          </div>
          <h2
            id="trending-title"
            className="font-semibold text-muted-foreground"
          >
            Tendances actuelles
          </h2>
        </motion.div>

        {trending.length > 0 ? (
          <motion.div
            variants={trendingStagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2"
          >
            {trending.map((t, i) => (
              <motion.div key={t.motCleId} variants={v.pop}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/20 py-3 transition-colors"
                  onClick={() => handleKeywordClick(t.libelle)}
                >
                  {t.libelle}
                  <span className="ml-1 opacity-50 text-[10px]">({t.count})</span>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-sm text-muted-foreground">Chargement des tendances...</p>
        )}
      </motion.section>

      {/* Résultats */}
      <div className="min-h-100">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 26,
                delay: 0.75,
              }}
              className="h-full flex flex-col items-center justify-center text-center p-12 border rounded-lg text-muted-foreground"
            >
              <motion.div
                initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.9,
                }}
              >
                <WandSparkles className="h-10 w-10 mb-4 opacity-20" />
              </motion.div>
              <p>Formulez une question complexe pour voir la magie operer.</p>
            </motion.div>
          ) : isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <SemanticLoader />
            </motion.div>
          ) : results.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="h-full flex flex-col items-center justify-center text-center p-12 border rounded-md bg-card/40"
            >
              <p className="text-muted-foreground">Aucun resultat semantique trouve pour cette requête.</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              variants={v.stagger(0.05)}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <motion.h2 variants={v.slideInLeft} className="text-lg font-semibold flex items-center">
                <Badge variant="outline" className="py-3 mr-3">
                  {results.length} resultats
                </Badge>
                Les plus pertinents selon l&apos;IA
              </motion.h2>
              <motion.div variants={gridStagger} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((memoire) => (
                  <MemoireCard
                    key={memoire.id}
                    memoire={memoire}
                    onClick={() => {
                      setSelectedMemoireId(memoire.id);
                      setIsDetailOpen(true);
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MemoireDetailModal
        memoireId={selectedMemoireId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMemoireId(null);
        }}
        onSelectSimilar={(id) => {
          setSelectedMemoireId(id);
        }}
      />
    </motion.div>
  );
}