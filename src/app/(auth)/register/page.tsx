"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
  }

  return (
    <Card className="border-0 ">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez Valiha pour consulter les mémoires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="nom">Nom</FieldLabel>
              <Input id="nom" placeholder="Mark" {...form.register("nom")} />
              {form.formState.errors.nom && (
                <FieldError>{form.formState.errors.nom.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
              <Input id="prenom" placeholder="Kowalsky" {...form.register("prenom")} />
              {form.formState.errors.prenom && (
                <FieldError>{form.formState.errors.prenom.message}</FieldError>
              )}
            </Field>
          </div>
          
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" placeholder="email@example.com" {...form.register("email")} />
            {form.formState.errors.email && (
              <FieldError>{form.formState.errors.email.message}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <Input id="password" type="password" placeholder="" {...form.register("password")} />
            {form.formState.errors.password && (
              <FieldError>{form.formState.errors.password.message}</FieldError>
            )}
          </Field>
          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              "S'inscrire"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
