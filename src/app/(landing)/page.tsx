"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "framer-motion";
import {
  GraduationCap,
  Search,
  Network,
  ShieldCheck,
  BuildingComplex,
  UserRoundCheck,
  Gift,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/theme-toggle";

/* ------------------------------------------------------------------ */
/*  Contenu                                                           */
/* ------------------------------------------------------------------ */

const benefits = [
  {
    icon: Search,
    title: "Cherchez par idée, pas par mot-clé",
    desc: "Une question, une problématique, un sujet à peine formulé : Valiha comprend le sens de votre requête et vous renvoie les mémoires les plus proches.",
  },
  {
    icon: Network,
    title: "Voyez les liens entre les travaux",
    desc: "Explorez le graphe des auteurs, encadreurs, thèmes et universités pour savoir qui a travaillé sur quoi, avec qui, et où.",
  },
  {
    icon: ShieldCheck,
    title: "Des références fiables",
    desc: "Seuls les mémoires validés par l’équipe sont publiés. Les mots-clés suivent le Thésaurus de l’UNESCO pour que vos recherches restent cohérentes.",
  },
];

// Place tes captures / GIFs dans /public/landing/
// `label` = intitulé court (puces sur mobile), `title` = intitulé complet (desktop)
const demos = [
  {
    id: "recherche",
    label: "Recherche",
    title: "Écrivez comme vous parlez",
    desc: "Les résultats arrivent classés par pertinence, même sans le mot exact.",
    src: "/landing/recherche.gif",
    alt: "Recherche sémantique : saisie d’une requête et affichage des résultats",
  },
  {
    id: "graphe",
    label: "Graphe",
    title: "Un clic, toute une école de pensée",
    desc: "Cliquez sur un encadreur pour voir ses mémoires et les thèmes qu’il a suivis.",
    src: "/landing/graphe.gif",
    alt: "Graphe interactif des auteurs, encadreurs et universités",
  },
  {
    id: "fiche",
    label: "Fiche",
    title: "Une fiche claire pour chaque mémoire",
    desc: "Résumé, encadreurs, université et mots-clés normalisés, au même endroit.",
    src: "/landing/fiche.png",
    alt: "Fiche détaillée d’un mémoire",
  },
  {
    id: "dashboard",
    label: "Statistiques",
    title: "Ce que la communauté consulte",
    desc: "Repérez les mémoires les plus consultés et les domaines qui avancent.",
    src: "/landing/dashboard.png",
    alt: "Tableau de bord avec les mémoires les plus consultés",
  },
];

const guarantees = [
  {
    icon: BuildingComplex,
    title: "Un projet ancré dans une institution réelle",
    desc: "Valiha est développé pour le CIDST Tsimbazaza, centre de référence de l’information scientifique et technique à Madagascar.",
  },
  {
    icon: UserRoundCheck,
    title: "Chaque mémoire est validé par un humain",
    desc: "Rien n’est publié sans modération. Vous cherchez dans des contenus relus, pas dans un fourre-tout.",
  },
  {
    icon: Gift,
    title: "Gratuit pendant le lancement",
    desc: "Créez votre compte maintenant : vous gardez votre accès gratuit.",
  },
  {
    icon: MessageSquare,
    title: "Vous décidez de la suite",
    desc: "Une fonction manque ? Un résultat vous semble faux ? Dites-le-nous : vos retours orientent directement la feuille de route.",
  },
];

/* ------------------------------------------------------------------ */
/*  Animations : déclenchées à l’entrée dans le viewport (whileInView) */
/* ------------------------------------------------------------------ */

const viewport = { once: true, margin: "-80px" } as const;

// Parent : fait entrer ses enfants en cascade
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// Enfant : fondu + légère montée
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 26 },
  },
};

// Captures : montée + léger zoom (pas de décalage latéral, donc rien ne déborde sur mobile)
const visual: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Composants                                                         */
/* ------------------------------------------------------------------ */

function Screenshot({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xl shadow-primary/15">
      <div
        aria-hidden
        className="flex items-center gap-1.5 border-b border-border px-3 py-2"
      >
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
      </div>
      <div className="relative aspect-video bg-muted">
        {failed ? (
          <div className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-muted-foreground">
            Ajoutez la capture dans public{src}
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            priority={priority}
            sizes="(min-width: 1024px) 420px, 90vw"
            className="object-cover object-top"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={item}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      className="max-w-2xl"
    >
      <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {children && (
        <p className="mt-4 leading-relaxed text-muted-foreground">{children}</p>
      )}
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [activeDemo, setActiveDemo] = useState(demos[0].id);
  const demo = demos.find((d) => d.id === activeDemo) ?? demos[0];

  // Déjà connecté : direction le dashboard
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-background">
        {/* Navbar */}
        <header className="sticky top-0 z-20 w-full border-b border-border/50 bg-background/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">Valiha</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Se connecter
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {/* 1. Héro */}
          <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16 lg:py-24">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12"
            >
              <div>
                <motion.h1
                  variants={item}
                  className="text-2xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl"
                >
                  Toute la recherche malgache, enfin au même endroit.
                </motion.h1>

                <motion.p
                  variants={item}
                  className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg"
                >
                  Décrivez votre sujet avec vos mots : Valiha retrouve les
                  mémoires et thèses les plus proches.
                </motion.p>

                <motion.div variants={item} className="mt-6">
                  <Button
                    size="lg"
                    className="h-11 w-full px-6 text-base sm:w-auto"
                    render={<Link href="/register">Créer mon compte gratuit</Link>}
                  />
                </motion.div>
              </div>

              <motion.div
                variants={visual}
                className="mx-auto w-full max-w-md lg:max-w-none"
              >
                <Screenshot
                  src="/landing/recherche.gif"
                  alt="Page de recherche sémantique de Valiha avec une requête en langage naturel et trois résultats"
                  priority
                />
              </motion.div>
            </motion.div>
          </section>

          {/* ───────────── 2. BÉNÉFICES ───────────── */}
          <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
            <SectionTitle title="Arrêtez de chercher dans le vide">
              Les travaux académiques malgaches sont dispersés et difficiles à
              retrouver. Résultat : on refait ce qui existe déjà, ou on passe à
              côté de références essentielles.
            </SectionTitle>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="mt-10 grid grid-cols-1 gap-8 sm:mt-14 md:grid-cols-3 md:gap-10"
            >
              {benefits.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={item}
                  className="border-t border-border pt-6"
                >
                  <Icon className="h-6 w-6 text-primary" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* 3. DÉMONSTRATION */}
          <section className="border-y border-border/50 bg-muted/30">
            <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
              <SectionTitle title="Voyez Valiha en action" />

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                className="mt-8 grid grid-cols-1 items-start gap-6 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-10"
              >
                {/* Mobile : puces défilables · Desktop : liste verticale */}
                <motion.div
                  variants={item}
                  role="tablist"
                  aria-label="Fonctionnalités de Valiha"
                  className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:gap-2 lg:overflow-visible lg:px-0 lg:pb-0"
                >
                  {demos.map((d) => {
                    const active = d.id === activeDemo;
                    return (
                      <Button
                        key={d.id}
                        type="button"
                        variant={active ? "accent" : "outline"}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveDemo(d.id)}
                        className="shrink-0 lg:h-auto lg:w-full lg:flex-col lg:items-start lg:justify-start lg:rounded-lg lg:px-4 lg:py-3 lg:text-left lg:whitespace-normal"
                      >
                        <span className="lg:hidden">{d.label}</span>
                        <span className="hidden font-semibold lg:block">{d.title}</span>
                        {active && (
                          <motion.span
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-1 hidden overflow-hidden text-sm font-normal leading-relaxed opacity-80 lg:block"
                          >
                            {d.desc}
                          </motion.span>
                        )}
                      </Button>
                    );
                  })}
                </motion.div>

                <motion.div
                  variants={visual}
                  className="mx-auto w-full max-w-md lg:max-w-none"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={demo.id}
                      role="tabpanel"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Screenshot key={demo.src} src={demo.src} alt={demo.alt} />
                      {/* Mobile : description sous la capture (la capture ne bouge pas) */}
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground lg:hidden">
                        <span className="font-semibold text-foreground">
                          {demo.title}.
                        </span>{" "}
                        {demo.desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ───────────── 4. GARANTIE & TRANSPARENCE ───────────── */}
          <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
            <SectionTitle title="Une plateforme construite avec vous, pas pour vous">
              Valiha vient de naître. Nous n’avons pas encore d’avis à afficher,
              mais nous avons des engagements.
            </SectionTitle>

            <motion.dl
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="mt-10 grid grid-cols-1 gap-8 sm:mt-14 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10"
            >
              {guarantees.map(({ icon: Icon, title, desc }) => (
                <motion.div key={title} variants={item} className="flex gap-4">
                  <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-semibold">{title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {desc}
                    </dd>
                  </div>
                </motion.div>
              ))}
            </motion.dl>

            <motion.p
              variants={item}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="mt-10 max-w-2xl text-muted-foreground sm:mt-12"
            >
              Valiha progresse à chaque retour. Votre avis compte plus que
              n’importe quelle campagne marketing.
            </motion.p>
          </section>

          {/* ───────────── 5. CTA FINAL ───────────── */}
          <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16"
            >
              <motion.h2
                variants={item}
                className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-balance sm:text-3xl"
              >
                Votre prochain sujet existe peut-être déjà dans Valiha.
              </motion.h2>
              <motion.p
                variants={item}
                className="mx-auto mt-4 max-w-xl leading-relaxed text-primary-foreground/80"
              >
                Rejoignez les premiers utilisateurs et aidez à construire la
                mémoire académique de Madagascar.
              </motion.p>
              <motion.div variants={item}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-8 h-11 w-full px-6 text-base sm:w-auto"
                  render={<Link href="/register">Créer mon compte gratuit</Link>}
                />
              </motion.div>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 px-6 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Valiha App © {new Date().getFullYear()}</span>
            </div>
            <span>Plateforme de gestion de mémoires universitaires</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}