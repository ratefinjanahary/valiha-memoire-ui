"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "motion/react";

const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis").min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Variants du conteneur principal (carte)
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

// Variants pour chaque élément enfant (header, champs, footer...)
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null);
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      const token = response.access_token || response.token;

      if (!token || !response.user) {
        throw new Error("Réponse inattendue du serveur");
      }

      setAuth(response.user, token);
      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "Identifiants invalides ou erreur réseau";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (Array.isArray(errorData)) {
          errorMessage = errorData.map((err) => err.msg || JSON.stringify(err)).join(", ");
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.detail) {
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map((err: { msg: any }) => err.msg || JSON.stringify(err))
              .join(", ");
          }
        } else if (typeof errorData === "object") {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrorMsg(errorMessage);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="w-full py-10 rounded-lg backdrop-blur-sm bg-background/10">
            <CardHeader className="text-center">
              <motion.div variants={itemVariants}>
                <CardTitle className="text-3xl font-bold text-primary">
                  Bienvenue
                </CardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription>
                  Connectez-vous à votre compte Valiha
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <Alert variant="destructive" className="bg-destructive/10 border-none">
                      <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="email@example.com"
                    className={errors.email ? "border-red-500 focus-visible:ring-red-200" : ""}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-xs font-medium"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className={
                        errors.password
                          ? "border-red-500 focus-visible:ring-red-200 pr-10"
                          : "pr-10"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-xs font-medium"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Button
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 relative overflow-hidden group"
                  >
                    <motion.span
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                        repeatDelay: 1,
                      }}
                      className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                    />
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                variants={itemVariants}
                className="mt-6 text-center text-sm text-muted-foreground"
              >
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-primary hover:underline font-semibold">
                  S&apos;inscrire
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}