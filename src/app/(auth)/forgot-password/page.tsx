"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion } from "motion/react";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api-error";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validators/pswd-reset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export default function ForgotPasswordPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setErrorMsg(null);
    try {
      const res = await authService.forgotPassword(email);
      // Message générique renvoyé par l'API (anti-énumération) : on l'affiche tel quel,
      // sans jamais laisser entendre que le compte existe ou non.
      setSuccessMsg(res.message);
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="w-full py-10 rounded-lg backdrop-blur-sm bg-background/10">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-primary">Mot de passe oublié</CardTitle>
              <CardDescription>
                Entrez votre e-mail, nous vous enverrons un lien de réinitialisation.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {successMsg ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>{successMsg}</AlertDescription>
                  </Alert>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    render={
                      <Link href="/login">Retour à la connexion</Link>
                    }
                  />
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <Alert variant="destructive" className="mb-4 bg-destructive/10 border-none">
                      <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="email@example.com"
                        {...register("email")}
                        className={errors.email ? "border-red-500 focus-visible:ring-red-200" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>
                      )}
                    </div>

                    <Button size="lg" type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Envoi...
                        </>
                      ) : (
                        "Envoyer le lien"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center text-muted-foreground">
                    <Link href="/login" className="text-primary hover:underline">
                      Retour à la connexion
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
