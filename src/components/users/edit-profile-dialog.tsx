"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import {
  profileFormSchema,
  type ProfileFormValues,
  type UpdateProfilePayload,
} from "@/lib/validators/profile";

type FieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user, setAuth } = useAuthStore();
  const [form, setForm] = useState<ProfileFormValues>({
    nom: "",
    prenom: "",
    email: "",
    ...emptyPasswords,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-remplit à chaque ouverture
  useEffect(() => {
    if (open && user) {
      setForm({ nom: user.nom, prenom: user.prenom, email: user.email, ...emptyPasswords });
      setErrors({});
    }
  }, [open, user]);

  const update = (field: keyof ProfileFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 1. Validation du formulaire
    const parsed = profileFormSchema.safeParse(form);
    const nextErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProfileFormValues;
        nextErrors[key] ??= issue.message;
      }
    }

    // 2. Ne garder que les champs modifiés
    const payload: UpdateProfilePayload = {};
    if (form.nom.trim() !== user.nom) payload.nom = form.nom.trim();
    if (form.prenom.trim() !== user.prenom) payload.prenom = form.prenom.trim();
    if (form.email.trim() !== user.email) payload.email = form.email.trim();
    if (form.newPassword) payload.newPassword = form.newPassword;

    if (Object.keys(payload).length === 0 && Object.keys(nextErrors).length === 0) {
      toast.info("Aucune modification à enregistrer");
      return;
    }

    // 3. Mot de passe actuel requis pour email / mot de passe
    if ((payload.email || payload.newPassword) && !form.currentPassword) {
      nextErrors.currentPassword = "Requis pour modifier l'email ou le mot de passe";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (payload.email || payload.newPassword) payload.currentPassword = form.currentPassword;

    setIsSubmitting(true);
    try {
      const res = await authService.updateProfile(payload);
      setAuth(res.user, res.access_token); // met à jour le store + le nouveau token
      toast.success("Profil mis à jour");
      onOpenChange(false);
    } catch (err: any) {
      const data = err?.response?.data;
      toast.error(data?.errors?.[0]?.message ?? data?.message ?? "Échec de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (
    id: keyof ProfileFormValues,
    label: string,
    type = "text",
    autoComplete?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={form[id]}
        onChange={update(id)}
        autoComplete={autoComplete}
        aria-invalid={!!errors[id]}
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !isSubmitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
          <DialogDescription>
            Mets à jour tes informations. Le mot de passe est optionnel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field("prenom", "Prénom", "text", "given-name")}
            {field("nom", "Nom", "text", "family-name")}
          </div>
          {field("email", "Email", "email", "email")}

          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Sécurité</p>
            {field("currentPassword", "Mot de passe actuel", "password", "current-password")}
            {field("newPassword", "Nouveau mot de passe", "password", "new-password")}
            {field("confirmPassword", "Confirmer le nouveau mot de passe", "password", "new-password")}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};