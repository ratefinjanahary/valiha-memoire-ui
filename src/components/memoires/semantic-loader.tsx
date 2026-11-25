import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";

const SEARCH_STEPS = [
  "Analyse de votre requête…",
  "Génération des vecteurs…",
  "Exploration de la mémoire académique…",
  "Calcul des similarités…",
  "Classement par pertinence…",
];

const SKELETON_COUNT = 3;

// Durée (en secondes) d'une étape
const STEP_DURATION = 1.6;
// Durée (en secondes) de la phase finale (palier → 100 %)
const FINISH_DURATION = 0.6;

const STEP_SIZE = 100 / SEARCH_STEPS.length;
// La dernière étape commence à ce palier : on y attend la réponse de l'API si besoin
const HOLD_VALUE = 100 - STEP_SIZE;

interface SemanticLoaderProps {
  /** true quand la réponse de l'API est arrivée */
  isDataReady: boolean;
  /** Appelé une fois l'animation terminée (barre à 100 %) */
  onComplete: () => void;
}

export const SemanticLoader = ({ isDataReady, onComplete }: SemanticLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [hasReachedHold, setHasReachedHold] = useState(false);
  const reduceMotion = useReducedMotion();

  // Évite de relancer les animations si le parent recrée le callback
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Phase 1 : 0 → palier, en parcourant toutes les étapes sauf la dernière
  useEffect(() => {
    const controls = animate(0, HOLD_VALUE, {
      duration: STEP_DURATION * (SEARCH_STEPS.length - 1),
      ease: "linear",
      onUpdate: setProgress,
      onComplete: () => setHasReachedHold(true),
    });
    return () => controls.stop();
  }, []);

  // Phase 2 : palier → 100 %, uniquement quand la phase 1 est finie ET que les données sont là
  useEffect(() => {
    if (!hasReachedHold || !isDataReady) return;

    const controls = animate(HOLD_VALUE, 100, {
      duration: FINISH_DURATION,
      ease: "easeOut",
      onUpdate: setProgress,
      onComplete: () => onCompleteRef.current(),
    });
    return () => controls.stop();
  }, [hasReachedHold, isDataReady]);

  const step = Math.min(Math.floor(progress / STEP_SIZE), SEARCH_STEPS.length - 1);

  return (
    <div className="space-y-6">
      {/* Étape en cours + progression */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>

          {/* Seule l'étape est annoncée aux lecteurs d'écran, pas chaque pas de la barre */}
          <div
            role="status"
            aria-live="polite"
            className="relative h-5 flex-1 overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={step}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-sm leading-5 text-muted-foreground"
              >
                {SEARCH_STEPS[step]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* motion met déjà la valeur à jour à chaque frame : on neutralise la
            transition CSS (transition-all) de l'indicateur shadcn, sinon elle
            redémarre à chaque frame et la barre n'a le temps de rattraper
            qu'une fois l'animation arrêtée. */}
        <Progress
          value={progress}
          aria-label="Progression de la recherche"
          className="h-0.5 **:transition-none!"
        />
      </div>

      {/* Aperçu du squelette des résultats */}
      <div aria-hidden className="space-y-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse space-y-2.5 rounded-lg border p-4 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 150}ms`, opacity: 1 - i * 0.25 }}
          >
            <div className="h-4 w-3/5 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
            <div className="h-3 w-1/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
};