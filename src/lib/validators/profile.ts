import { z } from "zod";

export const profileFormSchema = z
  .object({
    nom: z.string().trim().min(1, "Le nom est requis").max(100),
    prenom: z.string().trim().min(1, "Le prénom est requis").max(100),
    email: z.string().trim().email("Email invalide"),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    if (!d.newPassword) return;
    if (d.newPassword.length < 8) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "8 caractères minimum" });
    } else if (d.newPassword.length > 72) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "72 caractères maximum" });
    }
    if (d.newPassword !== d.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas",
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export interface UpdateProfilePayload {
  nom?: string;
  prenom?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}