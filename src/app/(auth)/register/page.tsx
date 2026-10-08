"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, GraduationCap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, type Variants } from "motion/react";

import { authService } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

const formSchema = z.object({
  nom: z.string().min(2, "Nom trop court"),
  prenom: z.string().min(2, "Prénom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  role: z.enum(["PUBLIC", "ETUDIANT", "DOCUMENTALISTE", "ADMIN"]),
});

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // easeOutExpo
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      password: "",
      role: "PUBLIC",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await authService.register(values);
      toast.success("Inscription réussie ! Vous pouvez vous connecter.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="w-full max-w-md"
    >
      <Card className="border-0 py-10 rounded-lg backdrop-blur-sm bg-background/10">
        <CardHeader className="space-y-2 text-center">
          <motion.div variants={itemVariants} className="flex justify-center mb-4">
            <motion.div
              initial={{ rotate: -12, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
              className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"
            >
              <GraduationCap className="h-6 w-6 text-primary" />
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Créer un compte
            </CardTitle>
          </motion.div>

          <motion.div variants={itemVariants}>
            <CardDescription>
              Rejoignez Valiha pour consulter les mémoires
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <Field>
                  <FieldLabel htmlFor="nom">Nom</FieldLabel>
                  <Input id="nom" placeholder="Mark" {...form.register("nom")} />
                  {form.formState.errors.nom && (
                    <FieldError>{form.formState.errors.nom.message}</FieldError>
                  )}
                </Field>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Field>
                  <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
                  <Input id="prenom" placeholder="Kowalsky" {...form.register("prenom")} />
                  {form.formState.errors.prenom && (
                    <FieldError>{form.formState.errors.prenom.message}</FieldError>
                  )}
                </Field>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" placeholder="email@example.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <FieldError>{form.formState.errors.password.message}</FieldError>
                )}
              </Field>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.div
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <motion.p variants={itemVariants} className="text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </motion.p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}