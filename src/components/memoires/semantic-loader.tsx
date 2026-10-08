import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/* ---------- Loader "wow" ---------- */
const SEARCH_STEPS = [
  "Compréhension de votre requête...",
  "Génération des vecteurs...",
  "Exploration de la mémoire académique...",
  "Calcul des similarités...",
  "Classement par pertinence...",
];

const ORBITS = [
  { size: 112, duration: 6, reverse: false, dot: "h-2 w-2" },
  { size: 152, duration: 9, reverse: true, dot: "h-1.5 w-1.5" },
  { size: 192, duration: 13, reverse: false, dot: "h-2.5 w-2.5" },
];

const FLOATING_VALUES = [
  { v: "0.82", x: -118, y: -30, d: 0 },
  { v: "-0.14", x: 112, y: -50, d: 0.6 },
  { v: "0.47", x: -96, y: 58, d: 1.2 },
  { v: "0.91", x: 100, y: 54, d: 1.8 },
  { v: "-0.33", x: 0, y: -104, d: 2.4 },
];

export const SemanticLoader = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, SEARCH_STEPS.length - 1)),
      1600
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-6 rounded-lg border bg-linear-to-b from-primary/5 to-background py-10"
    >
      <div className="relative h-52 w-52">
        {/* Anneaux qui pulsent */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 m-auto h-24 w-24 rounded-full border border-primary/40"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}

        {/* Orbites + particules */}
        {ORBITS.map((o, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 m-auto rounded-full border border-primary/10"
            style={{ width: o.size, height: o.size }}
            animate={{ rotate: o.reverse ? -360 : 360 }}
            transition={{ duration: o.duration, repeat: Infinity, ease: "linear" }}
          >
            <span
              className={`absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)] ${o.dot}`}
            />
          </motion.div>
        ))}

        {/* Valeurs d'embedding qui flottent */}
        {FLOATING_VALUES.map((f) => (
          <motion.span
            key={f.v}
            className="absolute font-mono text-[10px] text-primary/60 select-none"
            style={{ left: `calc(50% + ${f.x}px)`, top: `calc(50% + ${f.y}px)` }}
            animate={{ opacity: [0, 1, 0], y: [8, -8] }}
            transition={{ duration: 3, repeat: Infinity, delay: f.d, ease: "easeInOut" }}
          >
            {f.v}
          </motion.span>
        ))}

        {/* Noyau */}
        <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative flex h-full w-full items-center justify-center rounded-full border border-primary/30 bg-background/80 backdrop-blur"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-7 w-7 text-primary" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Étape en cours */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {SEARCH_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex gap-1.5">
          {SEARCH_STEPS.map((_, i) => (
            <motion.span
              key={i}
              className="h-1 rounded-full bg-primary"
              animate={{ width: i === step ? 24 : 8, opacity: i <= step ? 1 : 0.2 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            />
          ))}
        </div>

        {/* Barre indéterminée */}
        <div className="h-1 w-64 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full w-1/3 rounded-full bg-linear-to-r from-transparent via-primary to-transparent"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton de carte ---------- */
export const ResultSkeletonCard = ({ index }: { index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07 }}
      className="relative flex flex-col gap-3 overflow-hidden rounded-md border px-5 py-4"
    >
      <div className="flex gap-2">
        <div className="h-4 w-16 rounded-full bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="h-3 w-1/3 rounded bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-muted/70" />
        <div className="h-3 w-full rounded bg-muted/70" />
        <div className="h-3 w-2/3 rounded bg-muted/70" />
      </div>
      <div className="flex gap-1.5 pt-1">
        <div className="h-5 w-14 rounded-full bg-muted/70" />
        <div className="h-5 w-16 rounded-full bg-muted/70" />
        <div className="h-5 w-12 rounded-full bg-muted/70" />
      </div>

      {/* Shimmer */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-transparent via-primary/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: index * 0.15 }}
      />
    </motion.div>
  );
}