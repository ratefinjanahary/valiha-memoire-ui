"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  useSubmissionSteps,
  type SubmissionStatus,
  type SubmissionStep,
} from "@/hooks/use-submission-steps";

interface SubmitProcessingViewProps {
  steps: SubmissionStep[];
  status: SubmissionStatus;
  errorMessage: string | null;
  onBackToForm: () => void;
  onRetry: () => void;
  onClose: () => void;
}

type StepState = "done" | "active" | "failed" | "todo";

export function SubmitProcessingView({
  steps,
  status,
  errorMessage,
  onBackToForm,
  onRetry,
  onClose,
}: SubmitProcessingViewProps) {
  const reduceMotion = useReducedMotion();
  const { activeIndex, isComplete, progress } = useSubmissionSteps(steps, status);

  const visual = status === "error" ? "error" : isComplete ? "success" : "running";
  const current = steps[Math.min(activeIndex, steps.length - 1)];
  const Icon = current.icon;

  const title =
    visual === "success"
      ? "Mémoire soumis avec succès !"
      : visual === "error"
        ? "La soumission a échoué"
        : current.label;
  const subtitle =
    visual === "success"
      ? "Il est en attente de modération."
      : visual === "error"
        ? (errorMessage ?? "Une erreur est survenue.")
        : current.hint;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-1 flex-col"
    >
      {/* Barre de progression */}
      <div className="h-1 w-full overflow-hidden bg-muted">
        <motion.div
          className={cn("h-full", visual === "error" ? "bg-destructive" : "bg-primary")}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex min-h-96 flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
        {/* Icône centrale : change à chaque étape */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          {visual === "running" && !reduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/15"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={visual === "running" ? current.id : visual}
              initial={{ opacity: 0, scale: 0.6, rotate: reduceMotion ? 0 : -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: reduceMotion ? 0 : 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-full",
                visual === "running" && "bg-primary/10 text-primary",
                visual === "success" && "bg-success-bg text-success-text",
                visual === "error" && "bg-destructive/10 text-destructive",
              )}
            >
              {visual === "running" && <Icon className="h-9 w-9" />}
              {visual === "success" && <Check className="h-10 w-10" strokeWidth={3} />}
              {visual === "error" && <X className="h-10 w-10" strokeWidth={3} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Titre + phrase d'aide */}
        <div className="min-h-14 text-center" role="status" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${visual}-${current.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              <p className="font-medium">{title}</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">{subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Liste des étapes */}
        <ol className="w-full max-w-sm space-y-3">
          {steps.map((step, i) => {
            const state: StepState =
              i < activeIndex ? "done" : i > activeIndex ? "todo" : status === "error" ? "failed" : "active";

            return (
              <li key={step.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors",
                    state === "done" && "bg-success-bg text-success-text",
                    state === "active" && "border-primary text-primary",
                    state === "failed" && "border-destructive text-destructive",
                    state === "todo" && "border-border text-muted-foreground",
                  )}
                >
                  {state === "done" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </motion.span>
                  )}
                  {state === "active" && <Spinner className="h-3.5 w-3.5" />}
                  {state === "failed" && <X className="h-3.5 w-3.5" strokeWidth={3} />}
                  {state === "todo" && i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    state === "todo" && "text-muted-foreground",
                    state === "active" && "font-medium",
                    state === "failed" && "font-medium text-destructive",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Actions */}
        {visual === "success" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={onClose}>Fermer</Button>
          </motion.div>
        )}
        {visual === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Button variant="outline" onClick={onBackToForm}>
              Corriger le formulaire
            </Button>
            <Button onClick={onRetry}>Réessayer</Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}