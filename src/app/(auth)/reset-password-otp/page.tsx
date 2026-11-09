"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  forgotPasswordSchema,
  resetPasswordOtpSchema,
  type ForgotPasswordFormData,
  type ResetPasswordOtpFormData,
} from "@/lib/validators/password-reset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type Step = "request" | "verify" | "done";
const RESEND_DELAY_S = 60; // aligné sur le cooldown backend

// Défini hors du composant : sinon il serait recréé à chaque rendu et démonterait les formulaires
function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="w-full py-10 rounded-lg backdrop-blur-sm bg-background/10">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-primary">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordOtpPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailForm = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });
  const otpForm = useForm<ResetPasswordOtpFormData>({ resolver: zodResolver(resetPasswordOtpSchema) });

  // Compte à rebours avant de pouvoir redemander un code
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Demande (ou re-demande) de code. Le message est générique côté API (anti-énumération) :
  // on passe donc à l'étape suivante dans tous les cas, sans jamais laisser deviner si le compte existe.
  const requestCode = async (target: string): Promise<boolean> => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await authService.forgotPasswordOtp(target);
      setInfoMsg(res.message);
      setCooldown(RESEND_DELAY_S);
      return true;
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
      return false;
    }
  };

  const onRequest = async ({ email: value }: ForgotPasswordFormData) => {
    if (await requestCode(value)) {
      setEmail(value);
      setStep("verify");
    }
  };

  const onVerify = async ({ code, newPassword }: ResetPasswordOtpFormData) => {
    setErrorMsg(null);
    try {
      await authService.resetPasswordOtp({ email, code, newPassword });
      setStep("done");
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, "Code invalide ou expiré"));
      otpForm.resetField("code");
    }
  };

  // ─── Étape 3 : succès ───
  if (step === "done") {
    return (
      <Shell title="Mot de passe modifié">
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
      </Shell>
    );
  }

  // ─── Étape 1 : saisie de l'e-mail ───
  if (step === "request") {
    const { register, handleSubmit, formState } = emailForm;
    return (
      <Shell title="Réinitialisation par code" description="Nous vous enverrons un code à 6 chiffres par e-mail.">
        {errorMsg && (
          <Alert variant="destructive" className="mb-4 bg-destructive/10 border-none">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onRequest)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              {...register("email")}
              className={formState.errors.email ? "border-red-500 focus-visible:ring-red-200" : ""}
            />
            {formState.errors.email && (
              <p className="text-red-500 text-xs font-medium">{formState.errors.email.message}</p>
            )}
          </div>

          <Button size="lg" type="submit" disabled={formState.isSubmitting} className="w-full">
            {formState.isSubmitting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Envoi...
              </>
            ) : (
              "Envoyer le code"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
          <div>
            <Link href="/forgot-password" className="text-primary hover:underline">
              Recevoir un lien à la place
            </Link>
          </div>
          <div>
            <Link href="/login" className="hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Étape 2 : code + nouveau mot de passe ───
  const { register, handleSubmit, formState } = otpForm;
  const { errors, isSubmitting } = formState;

  return (
    <Shell title="Saisissez le code" description={`Code envoyé à ${email} (valable 10 minutes).`}>
      {infoMsg && !errorMsg && (
        <Alert className="mb-4">
          <AlertDescription>{infoMsg}</AlertDescription>
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="destructive" className="mb-4 bg-destructive/10 border-none">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onVerify)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="code">Code à 6 chiffres</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            {...register("code")}
            className={`text-center text-lg tracking-[0.4em] font-semibold ${
              errors.code ? "border-red-500 focus-visible:ring-red-200" : ""
            }`}
          />
          {errors.code && <p className="text-red-500 text-xs font-medium">{errors.code.message}</p>}
        </div>

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

        <Button size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Vérification...
            </>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={() => requestCode(email)}
          className="text-primary hover:underline disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
        </button>
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setInfoMsg(null);
            setStep("request");
          }}
          className="text-muted-foreground hover:underline"
        >
          Changer d&apos;e-mail
        </button>
      </div>
    </Shell>
  );
}
