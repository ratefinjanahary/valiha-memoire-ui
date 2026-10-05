"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Search, Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { searchService, TrendingKeyword } from "@/services/search.service";
import { Memoire } from "@/types/memoire";

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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
          delay: 0.05,
        }}
        className="relative overflow-hidden text-center py-8 px-4 rounded-lg bg-linear-to-b from-primary/5 to-background border"
      >
        {/* Brouillard animé */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
          <motion.div
            className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
            animate={{ x: [0, 260, 90, 0], y: [0, 50, 110, 0], scale: [1, 1.3, 0.9, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-10 right-0 h-96 w-96 rounded-full bg-[oklch(0.5106_0.2301_330)]/15 blur-3xl"
            animate={{ x: [0, -220, -60, 0], y: [0, 80, -30, 0], scale: [1, 0.85, 1.25, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            animate={{ x: [0, 180, -120, 0], y: [0, -60, 20, 0], scale: [1, 1.2, 1, 1] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Contenu du hero */}
        <div className="relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 22,
              delay: 0.15,
            }}
            className="flex justify-center mb-4"
          >
            <div className="h-16 w-16 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: 0.25,
            }}
            className="text-2xl font-semibold text-primary"
          >
            Recherche Semantique
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: 0.35,
            }}
            className="text-md text-muted-foreground max-w-2xl mx-auto"
          >
            Posez votre question naturellement. Notre IA Google analysera le sens de votre requete
            pour trouver les memoires les plus pertinents.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: 0.45,
            }}
            onSubmit={handleSemanticSearch}
            className="max-w-2xl mx-auto mt-8 flex gap-2"
          >
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
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Rechercher"}
            </Button>
          </motion.form>
        </div>
      </motion.div>

      {/* Bandeau tendances — sorti du grid des résultats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
          delay: 0.55,
        }}
        aria-labelledby="trending-title"
        className="rounded-md border px-5 py-4"
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: 0.65,
          }}
          className="flex items-center gap-3 mb-3"
        >
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2
            id="trending-title"
            className="font-semibold text-muted-foreground"
          >
            Tendances actuelles
          </h2>
        </motion.div>

        {trending.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trending.map((t, i) => (
              <motion.div
                key={t.motCleId}
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 22,
                  delay: 0.7 + i * 0.04,
                }}
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleKeywordClick(t.libelle)}
                >
                  {t.libelle}
                  <span className="ml-1 opacity-50 text-[10px]">({t.count})</span>
                </Badge>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chargement des tendances...</p>
        )}
      </motion.section>

      {/* Résultats — pleine largeur */}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="h-full flex flex-col items-center justify-center py-24"
            >
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">Analyse vectorielle en cours...</p>
            </motion.div>
          ) : results.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="h-full flex flex-col items-center justify-center text-center p-12 border rounded-2xl bg-card/50 border-dashed"
            >
              <p className="text-muted-foreground">Aucun resultat semantique trouve pour cette requete.</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-4"
            >
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: 0.05,
                }}
                className="text-lg font-semibold flex items-center"
              >
                <Badge variant="outline" className="py-3 mr-3">
                  {results.length} resultats
                </Badge>
                Les plus pertinents selon l&apos;IA
              </motion.h2>
              <div className="space-y-3">
                {results.map((memoire, index) => (
                  <MemoireResultCard key={memoire.id} memoire={memoire} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


/* Composant inline : carte resultat */
const degreeVariant: Record<string, "default" | "secondary" | "outline"> = {
  LICENCE: "secondary",
  MASTER: "default",
  DOCTORAT: "outline",
};

const degreeLabel: Record<string, string> = {
  LICENCE: "Licence",
  MASTER: "Master",
  DOCTORAT: "Doctorat",
};

function MemoireResultCard({ memoire, index }: { memoire: Memoire; index: number }) {
  const relevancePercent =
    memoire.jaccardScore != null ? Math.round(memoire.jaccardScore * 100) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 26,
        delay: 0.15 + index * 0.08,
      }}
      className="group relative flex flex-col gap-3 rounded-md border px-5 py-4 transition-all duration-200 hover:border-primary/40"
    >
      {/* Numero de rang */}
      <span className="absolute top-4 right-4 text-xs font-mono text-muted-foreground/40 select-none">
        #{index + 1}
      </span>

      {/* En-tete : diplome + metadonnees */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
          delay: 0.2 + index * 0.08,
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Badge variant={degreeVariant[memoire.typeDiplome] ?? "secondary"}>
          {degreeLabel[memoire.typeDiplome] ?? memoire.typeDiplome}
        </Badge>
        <span className="text-xs text-muted-foreground">{memoire.anneeSoutenance}</span>
        {memoire.universite && (
          <span className="text-xs text-muted-foreground">
            &middot; {memoire.universite.sigle ?? memoire.universite.nom}
          </span>
        )}
        {memoire.domaine && (
          <span className="text-xs text-muted-foreground">&middot; {memoire.domaine.nom}</span>
        )}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
          delay: 0.25 + index * 0.08,
        }}
        className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2"
      >
        {memoire.titre}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
          delay: 0.3 + index * 0.08,
        }}
        className="text-sm text-muted-foreground"
      >
        {memoire.auteurPrenom} {memoire.auteurNom}
      </motion.p>

      {memoire.resume && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: 0.35 + index * 0.08,
          }}
          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
        >
          {memoire.resume}
        </motion.p>
      )}

      {/* Mots-cles */}
      {memoire.motsCles && memoire.motsCles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: 0.4 + index * 0.08,
          }}
          className="flex flex-wrap gap-1.5 pt-1"
        >
          {memoire.motsCles.slice(0, 6).map(({ motCle }) => (
            <Badge key={motCle.id} variant="outline" className="text-[11px] px-2 py-0.5">
              {motCle.libelle}
            </Badge>
          ))}
          {memoire.motsCles.length > 6 && (
            <Badge variant="ghost" className="text-[11px] px-2 py-0.5 text-muted-foreground">
              +{memoire.motsCles.length - 6}
            </Badge>
          )}
        </motion.div>
      )}

      {/* Barre de pertinence semantique */}
      {relevancePercent !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: 0.45 + index * 0.08,
          }}
          className="pt-1 space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Pertinence semantique</span>
            <span className="font-medium text-foreground">{relevancePercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${relevancePercent}%` }}
              transition={{
                delay: 0.5 + index * 0.08,
                duration: 0.6,
                ease: "easeOut",
              }}
            />
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}