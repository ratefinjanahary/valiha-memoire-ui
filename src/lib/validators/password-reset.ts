import * as z from "zod";

// 8 min (aligné avec le backend) ; 72 max : limite de bcrypt
const newPasswordField = z
  .string()
  .min(8, "Le mot de passe doit faire au moins 8 caractères")
  .max(72, "Le mot de passe ne doit pas dépasser 72 caractères");

const confirmField = z.string().min(1, "Veuillez confirmer le mot de passe");

const passwordsMatch = {
  check: (d: { newPassword: string; confirmPassword: string }) => d.newPassword === d.confirmPassword,
  options: { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] as ["confirmPassword"] },
};

// ─── Flux par lien ───
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ newPassword: newPasswordField, confirmPassword: confirmField })
  .refine(passwordsMatch.check, passwordsMatch.options);
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Flux par code OTP ───
// L'étape 1 (demande du code) réutilise forgotPasswordSchema.
export const resetPasswordOtpSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres"),
    newPassword: newPasswordField,
    confirmPassword: confirmField,
  })
  .refine(passwordsMatch.check, passwordsMatch.options);
export type ResetPasswordOtpFormData = z.infer<typeof resetPasswordOtpSchema>;
