"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Search, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: BookOpen,
    title: "Bibliothèque de mémoires",
    desc: "Accédez à une collection complète de mémoires académiques organisés et indexés.",
  },
  {
    icon: Search,
    title: "Recherche avancée",
    desc: "Trouvez rapidement les travaux qui vous intéressent grâce à notre moteur de recherche puissant.",
  },
  {
    icon: Shield,
    title: "Accès sécurisé",
    desc: "Vos données sont protégées avec une authentification robuste et des droits d'accès contrôlés.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, damping: 25 
    } 
  },
};

export default function HeroPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      {/* Animated gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[100px] animate-pulse delay-700" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Navbar */}
      <header className="w-full border-b border-border/50 backdrop-blur-sm bg-background/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">Valiha App</span>
          </div>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl w-full mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0, 
              transition: { 
                type: "spring", 
                stiffness: 300, damping: 25 
              } 
            },
            }} 
            className="mb-6 inline-flex">
            <span className="inline-flex items-center gap-2 rounded-full font-semibold border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Plateforme académique numérique
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0, 
              transition: { 
                type: "spring", 
                stiffness: 300, damping: 25 
              } 
            },
            }}
            className="text-4xl font-bold tracking-tight leading-tight text-foreground"
          >
            La bibliothèque de{" "}
            <span className="relative text-primary">
              mémoires
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
                className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-primary/40 origin-left"
              />
            </span>{" "}
            universitaires
          </motion.h1>

          {/* Subheading */}
          <motion.p variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0, 
              transition: { 
                type: "spring", 
                stiffness: 300, damping: 25 
              } 
            },
            }}
            className="mt-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Accédez, recherchez et gérez les mémoires académiques de votre institution en toute simplicité.
            Une plateforme pensée pour les étudiants, les documentalistes et les administrateurs.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0, 
              transition: { 
                type: "spring", 
                stiffness: 300, damping: 25 
              } 
            },
            }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" className="h-10 px-6 text-base relative overflow-hidden group"
              render={
                <Link href="/login">
                <motion.span
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1.5 }}
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                />
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              }
            />
            <Button size="lg" variant="outline" className="h-10 px-6 text-base" 
              render={
                <Link href="/register">Créer un compte</Link>
              }
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          className="mt-24 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                className="group relative rounded-md border border-border backdrop-blur-sm p-6 text-left overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-primary/5 to-transparent"
                />
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Valiha App © {new Date().getFullYear()}</span>
          </div>
          <span>Plateforme de gestion de mémoires universitaires</span>
        </div>
      </footer>
    </div>
  );
}
