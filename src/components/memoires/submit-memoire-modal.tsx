"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

import { memoireService } from "@/services/memoire.service";
import { Universite, Domaine } from "@/types/memoire";
import { EncadreurCombobox } from "@/components/encadreurs/encadreur-combobox";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];
const MAX_ENCADREURS = 5; // aligné sur l'API

const encadreurOptionSchema = z.object({
  id: z.string().uuid(),
  nom: z.string(),
  prenom: z.string(),
  titre: z.string().nullish(),
});

const formSchema = z.object({
  titre: z.string().min(5, "Le titre est requis"),
  resume: z.string().min(10, "Un court résumé est requis"),
  anneeSoutenance: z.coerce.number().min(2000).max(new Date().getFullYear()),
  typeDiplome: z.enum(["LICENCE", "MASTER", "DOCTORAT"]),
  auteurNom: z.string().min(2, "Nom requis"),
  auteurPrenom: z.string().min(2, "Prénom requis"),
  auteurEmail: z.string().email("Email invalide"),
  universiteId: z.string().uuid("Université requise"),
  domaineId: z.string().uuid("Domaine requis"),
  encadreurs: z
    .array(encadreurOptionSchema)
    .min(1, "Au moins un encadreur est requis")
    .max(MAX_ENCADREURS, `${MAX_ENCADREURS} encadreurs maximum`),
  auteurEncadreur: encadreurOptionSchema.nullable(),
  file: z.any()
    .refine((files) => files?.length === 1, "Un fichier PDF est requis.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Taille max: 10MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Seuls les fichiers PDF sont acceptés."
    ),
});

interface SubmitMemoireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitMemoireModal({ isOpen, onClose, onSuccess }: SubmitMemoireModalProps) {
  const [universites, setUniversites] = useState<Universite[]>([]);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titre: "",
      resume: "",
      anneeSoutenance: new Date().getFullYear(),
      typeDiplome: "MASTER",
      auteurNom: "",
      auteurPrenom: "",
      auteurEmail: "",
      universiteId: "",
      domaineId: "",
      encadreurs: [],
      auteurEncadreur: null,
    },
  });

  // Chaque ComboBox exclut les choix de l'autre : un auteur ne peut pas être son propre encadreur
  const encadreursChoisis = form.watch("encadreurs");
  const auteurEncadreurChoisi = form.watch("auteurEncadreur");

  useEffect(() => {
    if (isOpen) {
      memoireService.getUniversites().then(setUniversites).catch(console.error);
      memoireService.getDomaines().then(setDomaines).catch(console.error);
    } else {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("file", values.file[0]);
      formData.append("titre", values.titre);
      formData.append("resume", values.resume);
      formData.append("anneeSoutenance", values.anneeSoutenance.toString());
      formData.append("typeDiplome", values.typeDiplome);
      formData.append("auteurNom", values.auteurNom);
      formData.append("auteurPrenom", values.auteurPrenom);
      formData.append("auteurEmail", values.auteurEmail);
      formData.append("universiteId", values.universiteId);
      formData.append("domaineId", values.domaineId);
      // Clé répétée : une entrée par encadreur (parsée en tableau côté API)
      values.encadreurs.forEach((e) => formData.append("encadreurIds", e.id));
      if (values.auteurEncadreur) {
        formData.append("auteurEncadreurId", values.auteurEncadreur.id);
      }

      await memoireService.submit(formData);
      
      toast.success("Mémoire soumis avec succès ! Il est en attente de modération.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <UploadCloud className="mr-2 h-5 w-5 text-primary" />
            Soumettre un mémoire
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations et téléversez le document PDF de votre mémoire.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller control={form.control} name="auteurNom" render={({ field, fieldState }) => (
                <Field><FieldLabel>Nom de l'auteur</FieldLabel><FieldContent><Input {...field} /></FieldContent><FieldError errors={[fieldState.error]} /></Field>
              )} />
              <Controller control={form.control} name="auteurPrenom" render={({ field, fieldState }) => (
                <Field><FieldLabel>Prénom de l'auteur</FieldLabel><FieldContent><Input {...field} /></FieldContent><FieldError errors={[fieldState.error]} /></Field>
              )} />
            </div>

            <Controller control={form.control} name="auteurEmail" render={({ field, fieldState }) => (
              <Field><FieldLabel>Email de l'auteur</FieldLabel><FieldContent><Input type="email" placeholder="etudiant@valiha.com" {...field} /></FieldContent><FieldError errors={[fieldState.error]} /></Field>
            )} />

            <Controller control={form.control} name="titre" render={({ field, fieldState }) => (
              <Field><FieldLabel>Titre du mémoire</FieldLabel><FieldContent><Input {...field} /></FieldContent><FieldError errors={[fieldState.error]} /></Field>
            )} />

            <Controller control={form.control} name="resume" render={({ field, fieldState }) => (
              <Field><FieldLabel>Résumé</FieldLabel><FieldContent><Textarea className="h-24 resize-none" {...field} /></FieldContent><FieldError errors={[fieldState.error]} /></Field>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller control={form.control} name="universiteId" render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Université</FieldLabel>
                  <FieldContent>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                      <SelectContent>
                        {universites.map((u) => (<SelectItem key={u.id} value={u.id}>{u.sigle || u.nom}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )} />
              <Controller control={form.control} name="domaineId" render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Domaine</FieldLabel>
                  <FieldContent>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                      <SelectContent>
                        {domaines.map((d) => (<SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )} />
            </div>

            <Controller control={form.control} name="encadreurs" render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Encadreur(s)</FieldLabel>
                <FieldContent>
                  <EncadreurCombobox
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    max={MAX_ENCADREURS}
                    excludeIds={auteurEncadreurChoisi ? [auteurEncadreurChoisi.id] : []}
                    placeholder="Rechercher par nom, prénom ou titre..."
                  />
                  <p className="text-xs text-muted-foreground">
                    1 à {MAX_ENCADREURS} encadreurs. Introuvable ? Créez-le depuis la liste.
                  </p>
                </FieldContent>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )} />

            <Controller control={form.control} name="auteurEncadreur" render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>L'auteur est lui-même un encadreur ? (optionnel)</FieldLabel>
                <FieldContent>
                  <EncadreurCombobox
                    value={field.value ? [field.value] : []}
                    onChange={(selection) => field.onChange(selection[0] ?? null)}
                    onBlur={field.onBlur}
                    max={1}
                    excludeIds={encadreursChoisis.map((e) => e.id)}
                    placeholder="Rechercher l'auteur parmi les encadreurs..."
                  />
                  <p className="text-xs text-muted-foreground">
                    À renseigner si l'auteur est déjà enregistré comme encadreur : son mémoire sera relié à lui dans le graphe.
                  </p>
                </FieldContent>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller control={form.control} name="typeDiplome" render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Type de Diplôme</FieldLabel>
                  <FieldContent>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LICENCE">Licence</SelectItem>
                        <SelectItem value="MASTER">Master</SelectItem>
                        <SelectItem value="DOCTORAT">Doctorat</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )} />
              <Controller control={form.control} name="anneeSoutenance" render={({ field, fieldState }) => (
                <Field><FieldLabel>Année de soutenance</FieldLabel><FieldContent><Input type="number" {...field} /></FieldContent><FieldError errors={[fieldState.error]} /></Field>
              )} />
            </div>

            <Controller control={form.control} name="file" render={({ field: { value, onChange, ...fieldProps }, fieldState }) => (
              <Field>
                <FieldLabel>Document PDF</FieldLabel>
                <FieldContent>
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    className="file:text-primary file:bg-primary/10 file:px-4 file:rounded-sm file:border-0 file:mr-4 hover:file:bg-primary/20 cursor-pointer h-9"
                    onChange={(event) => onChange(event.target.files)}
                    {...fieldProps} 
                  />
                </FieldContent>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )} />

            <div className="flex justify-end gap-3 pt-6 pb-2">
              <Button 
                type="button" 
                size="lg" 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="px-5"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="px-6"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Soumettre
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
