"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api-error";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validators/password-reset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

// Défini hors du composant : sinon il serait recréé à chaque rendu et démonterait le formulaire
// (perte des valeurs saisies).
function Wrapper({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  return (
  <div className="w-full flex items-center justify-center">
    <div className="w-full max-w-md px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="w-full py-10 rounded-lg backdrop-blur-sm bg-background/10">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-muted-foreground">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </motion.div>
    </div>
  </div>
);
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async ({ newPassword }: ResetPasswordFormData) => {
    if (!token) return;
    setErrorMsg(null);
    try {
      await authService.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (error) {
      // 400 "Lien invalide ou expiré" : on propose d'en redemander un
      setErrorMsg(getApiErrorMessage(error, "Lien invalide ou expiré"));
    }
  };

  // État : lien sans token
  if (!token) {
    return (
      <Wrapper title="Lien invalide">
        <Alert variant="destructive" className="mb-4 bg-destructive/10 border-none">
          <AlertDescription>Ce lien est incomplet ou invalide.</AlertDescription>
        </Alert>
        <Button 
          className="w-full"
          render={
            <Link href="/forgot-password">Demander un nouveau lien</Link>
          }
        />
      </Wrapper>
    );
  }

  // État : succès
  if (success) {
    return (
      <Wrapper title="Mot de passe modifié">
        <Alert className="mb-4">
          <AlertDescription>
            Votre mot de passe a été réinitialisé. Vos autres sessions ont été déconnectées.
          </AlertDescription>
        </Alert>
        <Button 
          className="w-full"
          render={
            <Link href="/login">Se connecter</Link>
          }
        />
      </Wrapper>
    );
  }

  // État : formulaire (+ erreur éventuelle)
  return (
    <Wrapper title="Nouveau mot de passe" description="Choisissez un mot de passe d'au moins 8 caractères.">
      {errorMsg && (
        <Alert variant="destructive" className="mb-4 bg-destructive/10 border-none">
          <AlertDescription>
            {errorMsg}{" "}
            <Link href="/forgot-password" className="underline font-semibold">
              Demander un nouveau lien
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("newPassword")}
              className={errors.newPassword ? "border-red-500 focus-visible:ring-red-200 pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs font-medium">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-200" : ""}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button size="lg" type="submit" disabled={isSubmitting} className="w-full mt-4">
          {isSubmitting ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Enregistrement...
            </>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>
      </form>
    </Wrapper>
  );
}
