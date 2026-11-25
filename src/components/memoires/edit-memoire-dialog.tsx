"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import type {
  Domaine,
  Memoire,
  TypeDiplome,
  UpdateMemoirePayload,
  UniversiteOption,
} from "@/types/memoire";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UniversiteCombobox } from "@/components/universites/universite-combobox";
import { KeywordsInput } from "@/components/memoires/keywords-input";
import { SubmitProcessingView } from "@/components/memoires/submit-processing-view";
import {
  buildEditSteps,
  type SubmissionStatus,
  type SubmissionStep,
} from "@/hooks/use-submission-steps";

interface FormState {
  titre: string;
  resume: string;
  anneeSoutenance: string;
  typeDiplome: TypeDiplome;
  auteurNom: string;
  auteurPrenom: string;
  auteurEmail: string;
  universite: UniversiteOption | null;
  domaineId: string;
  motsCles: string[];
}

const keywordsOf = (m: Memoire) => (m.motsCles ?? []).map((x) => x.motCle.libelle);

const toForm = (m: Memoire): FormState => ({
  titre: m.titre,
  resume: m.resume ?? "",
  anneeSoutenance: String(m.anneeSoutenance),
  typeDiplome: m.typeDiplome,
  auteurNom: m.auteurNom,
  auteurPrenom: m.auteurPrenom,
  auteurEmail: m.auteurEmail ?? "",
  universite: m.universite ? { id: m.universite.id, nom: m.universite.nom, sigle: m.universite.sigle } : null,
  domaineId: m.domaineId ?? m.domaine?.id ?? "",
  motsCles: keywordsOf(m),
});

/** Message lisible depuis une erreur API (gère le format { errors: [{ champ, message }] } du ZodValidationPipe) */
export function getApiErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;
  const first = data?.errors?.[0];
  if (first) return `${first.champ} : ${first.message}`;
  return (Array.isArray(data?.message) ? data.message[0] : data?.message) || fallback;
}

interface Props {
  memoire: Memoire | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type Phase = "form" | "processing";

export function EditMemoireDialog({ memoire, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Vue de chargement (même effet que la soumission), utilisée quand le serveur a plusieurs traitements à faire
  const [phase, setPhase] = useState<Phase>("form");
  const [status, setStatus] = useState<SubmissionStatus>("running");
  const [steps, setSteps] = useState<SubmissionStep[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Change à chaque tentative pour remettre à zéro la progression simulée de SubmitProcessingView
  const [attempt, setAttempt] = useState(0);
  const lastRun = useRef<{ payload: UpdateMemoirePayload; steps: SubmissionStep[] } | null>(null);

  // Recharge le formulaire à chaque ouverture
  useEffect(() => {
    if (open && memoire) {
      setForm(toForm(memoire));
      setPhase("form");
      setStatus("running");
      setErrorMessage(null);
    }
  }, [open, memoire]);

  // Liste des domaines (une seule fois) ; les universités sont chargées par le ComboBox lui-même
  useEffect(() => {
    if (!open || domaines.length > 0) return;
    memoireService
      .getDomaines()
      .then(setDomaines)
      .catch(() => toast.error("Impossible de charger les domaines"));
  }, [open, domaines.length]);

  if (!memoire || !form) return null;

  const isRunning = phase === "processing" && status === "running";
  const isBusy = isSaving || isRunning;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  /** N'envoie que les champs réellement modifiés */
  const buildPayload = (): UpdateMemoirePayload => {
    const original = toForm(memoire);
    const payload: UpdateMemoirePayload = {};

    if (form.titre !== original.titre) payload.titre = form.titre.trim();
    if (form.resume !== original.resume) payload.resume = form.resume.trim();
    if (form.anneeSoutenance !== original.anneeSoutenance) payload.anneeSoutenance = Number(form.anneeSoutenance);
    if (form.typeDiplome !== original.typeDiplome) payload.typeDiplome = form.typeDiplome;
    if (form.auteurNom !== original.auteurNom) payload.auteurNom = form.auteurNom.trim();
    if (form.auteurPrenom !== original.auteurPrenom) payload.auteurPrenom = form.auteurPrenom.trim();
    if (form.auteurEmail !== original.auteurEmail) payload.auteurEmail = form.auteurEmail.trim() || null;
    if (form.universite && form.universite.id !== original.universite?.id) payload.universiteId = form.universite.id;
    if (form.domaineId !== original.domaineId) payload.domaineId = form.domaineId;

    if (JSON.stringify(form.motsCles) !== JSON.stringify(original.motsCles)) payload.motsCles = form.motsCles;

    return payload;
  };

  /**
   * Envoie la modification.
   * - Plusieurs étapes serveur (mots-clés IA, réindexation…) → vue de chargement détaillée.
   * - Simple enregistrement (ex. nom de l'auteur) → comportement rapide d'origine (spinner + toast).
   */
  const runUpdate = async (payload: UpdateMemoirePayload, runSteps: SubmissionStep[]) => {
    lastRun.current = { payload, steps: runSteps };
    const withProgress = runSteps.length > 1;

    if (withProgress) {
      setSteps(runSteps);
      setAttempt((a) => a + 1);
      setStatus("running");
      setErrorMessage(null);
      setPhase("processing");
    } else {
      setIsSaving(true);
    }

    try {
      await memoireService.update(memoire.id, payload);
      onSaved(); // rafraîchit la liste derrière le dialogue
      if (withProgress) {
        setStatus("done");
      } else {
        toast.success("Mémoire modifié avec succès");
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("update memoire:", err);
      const message = getApiErrorMessage(err, "Erreur lors de la modification du mémoire");
      if (withProgress) {
        setErrorMessage(message);
        setStatus("error");
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      toast.info("Aucune modification à enregistrer");
      return;
    }
    runUpdate(payload, buildEditSteps(payload));
  };

  const handleRetry = () => {
    if (lastRun.current) runUpdate(lastRun.current.payload, lastRun.current.steps);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isBusy && onOpenChange(o)}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl"
        showCloseButton={!isRunning}
      >
        {phase === "processing" ? (
          <>
            {/* Titre et description pour les lecteurs d'écran (la vue de chargement a ses propres textes) */}
            <DialogTitle className="sr-only">Modification du mémoire</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrement et traitement des modifications en cours.
            </DialogDescription>
            <SubmitProcessingView
              key={attempt}
              steps={steps}
              status={status}
              errorMessage={errorMessage}
              successTitle="Mémoire modifié avec succès !"
              successSubtitle="Les modifications ont bien été enregistrées."
              errorTitle="La modification a échoué"
              onBackToForm={() => setPhase("form")}
              onRetry={handleRetry}
              onClose={() => onOpenChange(false)}
            />
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Modifier le mémoire</DialogTitle>
              <DialogDescription>
                Seuls les champs modifiés sont envoyés. Le statut du mémoire n&apos;est pas changé.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="titre">Titre</Label>
                  <Input id="titre" value={form.titre} onChange={(e) => set("titre", e.target.value)} />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="resume">Résumé</Label>
                  <Textarea
                    id="resume"
                    value={form.resume}
                    onChange={(e) => set("resume", e.target.value)}
                    className="min-h-[140px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="auteurPrenom">Prénom de l&apos;auteur</Label>
                    <Input
                      id="auteurPrenom"
                      value={form.auteurPrenom}
                      onChange={(e) => set("auteurPrenom", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="auteurNom">Nom de l&apos;auteur</Label>
                    <Input id="auteurNom" value={form.auteurNom} onChange={(e) => set("auteurNom", e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="auteurEmail">Email de l&apos;auteur (facultatif)</Label>
                  <Input
                    id="auteurEmail"
                    type="email"
                    value={form.auteurEmail}
                    onChange={(e) => set("auteurEmail", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="annee">Année de soutenance</Label>
                    <Input
                      id="annee"
                      type="number"
                      value={form.anneeSoutenance}
                      onChange={(e) => set("anneeSoutenance", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="typeDiplome">Type de diplôme</Label>
                    <Select value={form.typeDiplome} onValueChange={(v) => set("typeDiplome", v as TypeDiplome)}>
                      <SelectTrigger id="typeDiplome" className="w-full">
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LICENCE">Licence</SelectItem>
                        <SelectItem value="MASTER">Master</SelectItem>
                        <SelectItem value="DOCTORAT">Doctorat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="universite">Université</Label>
                    <UniversiteCombobox
                      id="universite"
                      value={form.universite}
                      onChange={(u) => set("universite", u)}
                    />
                  </div>
                  <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="domaine">Domaine</Label>
                    <Select value={form.domaineId} onValueChange={(v) => set("domaineId", String(v))}>
                      <SelectTrigger id="domaine" className="w-full">
                        <SelectValue placeholder="Sélectionnez...">
                          {/* repli sur le domaine du mémoire tant que la liste n'est pas chargée */}
                          {domaines.find((d) => d.id === form.domaineId)?.nom ?? memoire.domaine?.nom}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {domaines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="motsCles">Mots-clés</Label>
                  <KeywordsInput value={form.motsCles} onChange={(v) => set("motsCles", v)} max={10} />
                  <p className="text-xs text-muted-foreground">
                    Entrée ou virgule pour ajouter (10 max). Tout retirer = régénérés automatiquement (titre + résumé)
                    et alignés sur le thésaurus du domaine. Changer le domaine seul ne recalcule pas les mots-clés.
                  </p>
                </div>

                {memoire.encadreurs && memoire.encadreurs.length > 0 && (
                  <div className="grid gap-1.5">
                    <Label>Encadreurs</Label>
                    <div className="flex flex-wrap gap-2">
                      {memoire.encadreurs.map(({ encadreur }) => (
                        <Badge key={encadreur.id} variant="outline">
                          {encadreur.titre ? `${encadreur.titre} ` : ""}
                          {encadreur.prenom} {encadreur.nom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="grid grid-cols-2 gap-3 px-6 py-6">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isBusy}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}