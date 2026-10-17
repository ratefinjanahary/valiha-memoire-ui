"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { memoireService } from "@/services/memoire.service";
import type {
  Domaine,
  Memoire,
  TypeDiplome,
  UpdateMemoirePayload,
  Universite,
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

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

interface FormState {
  titre: string;
  resume: string;
  anneeSoutenance: string;
  typeDiplome: TypeDiplome;
  auteurNom: string;
  auteurPrenom: string;
  auteurEmail: string;
  universiteId: string;
  domaineId: string;
  motsCles: string; // séparés par des virgules
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
  universiteId: m.universiteId ?? m.universite?.id ?? "",
  domaineId: m.domaineId ?? m.domaine?.id ?? "",
  motsCles: keywordsOf(m).join(", "),
});

const parseKeywords = (raw: string) =>
  raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

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

export function EditMemoireDialog({ memoire, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [universites, setUniversites] = useState<Universite[]>([]);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Recharge le formulaire à chaque ouverture
  useEffect(() => {
    if (open && memoire) setForm(toForm(memoire));
  }, [open, memoire]);

  // Listes de choix (une seule fois)
  useEffect(() => {
    if (!open || universites.length > 0) return;
    Promise.all([memoireService.getUniversites(), memoireService.getDomaines()])
      .then(([u, d]) => {
        setUniversites(u);
        setDomaines(d);
      })
      .catch(() => toast.error("Impossible de charger les universités / domaines"));
  }, [open, universites.length]);

  if (!memoire || !form) return null;

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
    if (form.universiteId !== original.universiteId) payload.universiteId = form.universiteId;
    if (form.domaineId !== original.domaineId) payload.domaineId = form.domaineId;

    if (form.motsCles !== original.motsCles) payload.motsCles = parseKeywords(form.motsCles);

    return payload;
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      toast.info("Aucune modification à enregistrer");
      return;
    }

    setIsSaving(true);
    try {
      await memoireService.update(memoire.id, payload);
      toast.success("Mémoire modifié avec succès");
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      console.error("update memoire:", err);
      toast.error(getApiErrorMessage(err, "Erreur lors de la modification du mémoire"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Modifier le mémoire</DialogTitle>
          <DialogDescription>
            Seuls les champs modifiés sont envoyés. Le statut du mémoire n&apos;est pas changé.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
          <div className="grid gap-4 px-6 py-2">
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
              <Input id="auteurPrenom" value={form.auteurPrenom} onChange={(e) => set("auteurPrenom", e.target.value)} />
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
              <select
                id="typeDiplome"
                className={selectClass}
                value={form.typeDiplome}
                onChange={(e) => set("typeDiplome", e.target.value as TypeDiplome)}
              >
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
                <option value="DOCTORAT">Doctorat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="universite">Université</Label>
              <select
                id="universite"
                className={selectClass}
                value={form.universiteId}
                onChange={(e) => set("universiteId", e.target.value)}
              >
                {universites.length === 0 && memoire.universite && (
                  <option value={form.universiteId}>{memoire.universite.nom}</option>
                )}
                {universites.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                    {u.sigle ? ` (${u.sigle})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="domaine">Domaine</Label>
              <select
                id="domaine"
                className={selectClass}
                value={form.domaineId}
                onChange={(e) => set("domaineId", e.target.value)}
              >
                {domaines.length === 0 && memoire.domaine && (
                  <option value={form.domaineId}>{memoire.domaine.nom}</option>
                )}
                {domaines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="motsCles">Mots-clés</Label>
            <Input
              id="motsCles"
              value={form.motsCles}
              onChange={(e) => set("motsCles", e.target.value)}
              placeholder="intelligence artificielle, agriculture, madagascar"
            />
            <p className="text-xs text-muted-foreground">
              Séparés par des virgules (10 max). Vide = régénérés automatiquement à partir du titre et du résumé.
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
