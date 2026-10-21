import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const SEARCH_STEPS = [
  "Analyse de votre requête…",
  "Génération des vecteurs…",
  "Exploration de la mémoire académique…",
  "Calcul des similarités…",
  "Classement par pertinence…",
];

const SKELETON_COUNT = 3;

export const SemanticLoader = () => {
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, SEARCH_STEPS.length - 1)),
      1600
    );
    return () => clearInterval(id);
  }, []);

  const progress = ((step + 1) / SEARCH_STEPS.length) * 100;

  return (
    <div role="status" aria-live="polite" className="space-y-6">
      {/* Étape en cours + progression */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>

          <div className="relative h-5 flex-1 overflow-hidden">
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

        <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
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