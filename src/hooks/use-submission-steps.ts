"use client";

import { useEffect, useState } from "react";
import {
  WandSparkles,
  DatabaseZap,
  ArrowUpFromLine,
  ScanText,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type SubmissionStatus = "running" | "done" | "error";

export type SubmissionStepId = "upload" | "summary" | "keywords" | "save" | "index";

export interface SubmissionStep {
  id: SubmissionStepId;
  label: string;
  /** Phrase affichée sous l'icône centrale quand l'étape est en cours */
  hint: string;
  icon: LucideIcon;
  /** Durée estimée avant de passer à l'étape suivante (la dernière étape attend la vraie réponse) */
  estimatedMs: number;
}

interface BuildStepsInput {
  hasFile: boolean;
  hasResume: boolean;
  hasKeywords: boolean;
}

/** N'affiche que les étapes qui vont réellement avoir lieu côté serveur, dans l'ordre du backend. */
export function buildSubmissionSteps({ hasFile, hasResume, hasKeywords }: BuildStepsInput): SubmissionStep[] {
  const steps: SubmissionStep[] = [];

  if (hasFile) {
    steps.push({
      id: "upload",
      label: "Envoi du document",
      hint: "Transfert de votre PDF…",
      icon: ArrowUpFromLine,
      estimatedMs: 1500,
    });
  }

  if (hasFile && !hasResume) {
    steps.push({
      id: "summary",
      label: "Lecture du PDF et rédaction du résumé",
      hint: "L'IA lit votre document pour en rédiger le résumé…",
      icon: ScanText,
      estimatedMs: 9000,
    });
  }

  steps.push(
    hasKeywords
      ? {
          id: "keywords",
          label: "Alignement des mots-clés sur le thésaurus",
          hint: "Recherche des descripteurs officiels du domaine…",
          icon: Tags,
          estimatedMs: 4000,
        }
      : {
          id: "keywords",
          label: "Génération des mots-clés",
          hint: "L'IA propose des mots-clés, puis les relie au thésaurus…",
          icon: Tags,
          estimatedMs: 6000,
        },
  );

  steps.push(
    {
      id: "save",
      label: "Enregistrement du mémoire",
      hint: "Enregistrement dans la base…",
      icon: DatabaseZap,
      estimatedMs: 1500,
    },
    {
      id: "index",
      label: "Indexation pour la recherche sémantique",
      hint: "Calcul de l'empreinte sémantique du mémoire…",
      icon: WandSparkles,
      estimatedMs: 3000,
    },
  );

  return steps;
}

const FAST_FORWARD_MS = 350;

/**
 * Fait avancer les étapes de façon simulée.
 * - "running" : avance selon les durées estimées, mais reste sur la dernière étape tant que le serveur n'a pas répondu.
 * - "done"    : termine rapidement les étapes restantes (le serveur a répondu).
 * - "error"   : se fige sur l'étape en cours.
 *
 * `steps` doit être stable (état React ou useMemo), sinon les timers sont relancés à chaque rendu.
 * L'état repart de zéro quand le composant qui utilise ce hook est démonté puis remonté.
 */
export function useSubmissionSteps(steps: SubmissionStep[], status: SubmissionStatus) {
  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndex = steps.length - 1;

  useEffect(() => {
    if (status !== "running" || activeIndex >= lastIndex) return;
    const timer = setTimeout(
      () => setActiveIndex((i) => Math.min(i + 1, lastIndex)),
      steps[activeIndex].estimatedMs,
    );
    return () => clearTimeout(timer);
  }, [status, activeIndex, lastIndex, steps]);

  useEffect(() => {
    if (status !== "done" || activeIndex >= steps.length) return;
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), FAST_FORWARD_MS);
    return () => clearTimeout(timer);
  }, [status, activeIndex, steps.length]);

  const isComplete = status === "done" && activeIndex >= steps.length;
  const progress =
    activeIndex >= steps.length ? 100 : Math.round(((activeIndex + 0.5) / steps.length) * 100);

  return { activeIndex, isComplete, progress };
}