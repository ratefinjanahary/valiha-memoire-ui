"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import type { PieSectorShapeProps } from "recharts";
import {
  XCircle,
  ChevronDown,
  ListFilter,
  LucideIcon,
  BookOpenCheck,
  Clock,
  FileSearchCorner,
} from "lucide-react";

import {
  analyticsService,
  type AnneeItem,
  type ChartItem,
  type ChartsOptions,
} from "@/services/analytics.service";
import { memoireService } from "@/services/memoire.service";
import { TopMemoire } from "@/types/memoire";
import { TopMemoiresBarChart } from "@/components/dashboard/top-memoires-bar-chart";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface Kpis {
  totalMemoires: number;
  enAttente: number;
  rejetes: number;
  totalConsultations: number;
}

const NB_ANNEES = 5;
const MAX_UNIVERSITES = 5;

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const currentYear = new Date().getFullYear();
const ANNEES = Array.from({ length: 6 }, (_, i) => currentYear - i);

const PIE_COLORS = [
  "var(--color-primary)",              // votre primaire (déjà en OKLCH)
  "oklch(0.5854 0.2041 277.1173)",     // #6366f1 — indigo
  "oklch(0.6960 0.1700 162.4800)",     // #10b981 — émeraude
  "oklch(0.7690 0.1650 70.0800)",      // #f59e0b — ambre
  "oklch(0.6370 0.2080 25.3300)",      // #ef4444 — rouge
  "oklch(0.6056 0.2189 292.7172)",     // #8b5cf6 — violet
  "oklch(0.7038 0.1230 182.5025)",     // #14b8a6 — teal
];

type PieDatum = ChartItem & { fill: string };

// La couleur vient de la donnée elle-même (et non de l'index du secteur) :
// le camembert et la légende lisent donc exactement la même source.
const MyCustomPie = (props: PieSectorShapeProps) => (
  <Sector
    {...props}
    fill={(props.payload as PieDatum | undefined)?.fill ?? PIE_COLORS[0]}
    stroke="var(--color-background, #fff)"
    strokeWidth={2}
  />
);

// Attribue une couleur à chaque université sélectionnée.
// - une université garde sa couleur tant qu'elle reste sélectionnée ;
// - une nouvelle université reçoit une couleur libre (7 couleurs pour 5 max : jamais de doublon).
function assignColors(
  ids: string[],
  previous: Record<string, string>
): Record<string, string> {
  const next: Record<string, string> = {};
  const used = new Set<string>();

  for (const id of ids) {
    if (previous[id]) {
      next[id] = previous[id];
      used.add(previous[id]);
    }
  }
  for (const id of ids) {
    if (!next[id]) {
      const free = PIE_COLORS.find((c) => !used.has(c)) ?? PIE_COLORS[0];
      next[id] = free;
      used.add(free);
    }
  }
  return next;
}

const kpiConfig: {
  key: keyof Kpis;
  title: string;
  description: string;
  icon: LucideIcon;
  format?: (value: number) => string;
}[] = [
  {
    key: "totalMemoires",
    title: "Mémoires Validés",
    description: "Mémoires publiés et accessibles",
    icon: BookOpenCheck,
  },
  {
    key: "enAttente",
    title: "En attente de modération",
    description: "Soumissions en cours d'examen",
    icon: Clock,
  },
  {
    key: "rejetes",
    title: "Mémoires Rejetés",
    description: "Dossiers non conformes",
    icon: XCircle,
  },
  {
    key: "totalConsultations",
    title: "Consultations",
    description: "Total des vues de mémoires",
    icon: FileSearchCorner,
    format: (v) => v.toLocaleString(),
  },
];

const EvolutionTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background/95 px-3 py-3 shadow-md backdrop-blur">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">
        {payload[0].value} mémoire{payload[0].value > 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [topMemoires, setTopMemoires] = useState<TopMemoire[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Graphique d'évolution (fenêtre de 5 ans)
  const [evolution, setEvolution] = useState<AnneeItem[]>([]);
  const [anneeDebut, setAnneeDebut] = useState<number | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(false);

  // Camembert (5 universités max)
  const [repartition, setRepartition] = useState<ChartItem[]>([]);
  const [universitesChoisies, setUniversitesChoisies] = useState<string[]>([]);
  const [repartitionLoading, setRepartitionLoading] = useState(false);
  const [colorById, setColorById] = useState<Record<string, string>>({});
  const repartitionRequestId = useRef(0);

  const [chartOptions, setChartOptions] = useState<ChartsOptions | null>(null);

  const [filtreMois, setFiltreMois] = useState<number | undefined>();
  const [filtreAnnee, setFiltreAnnee] = useState<number | undefined>();
  const [consultationsFiltrees, setConsultationsFiltrees] = useState<number | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [kpiData, chartData, topData] = await Promise.all([
          analyticsService.getKpis(),
          analyticsService.getChartsData(),
          memoireService.getTop(5),
        ]);
        setKpis(kpiData);
        setEvolution(chartData.evolutionAnnee);
        setAnneeDebut(chartData.periode.anneeDebut);
        setRepartition(chartData.repartitionUniversite);
        const initialIds = chartData.repartitionUniversite.map((i) => i.id);
        setUniversitesChoisies(initialIds);
        setColorById(assignColors(initialIds, {}));
        setChartOptions(chartData.options);
        setTopMemoires(topData);
      } catch (error) {
        console.error("Erreur chargement analytics", error);
        setError("Erreur lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!filtreMois && !filtreAnnee) {
      setConsultationsFiltrees(null);
      return;
    }
    let cancelled = false;
    analyticsService
      .getConsultationsStats({ annee: filtreAnnee, mois: filtreMois })
      .then((res) => {
        if (!cancelled) setConsultationsFiltrees(res.totalConsultations);
      })
      .catch((e) => console.error("Erreur stats consultations", e));
    return () => {
      cancelled = true;
    };
  }, [filtreMois, filtreAnnee]);

  const handlePeriodeChange = async (value: string | null) => {
    if (value === null) return;
    const debut = Number(value);
    setAnneeDebut(debut);
    setEvolutionLoading(true);
    try {
      const res = await analyticsService.getEvolution(debut);
      setEvolution(res.data);
    } catch (e) {
      console.error("Erreur évolution par année", e);
    } finally {
      setEvolutionLoading(false);
    }
  };

  const handleToggleUniversite = async (id: string, checked: boolean) => {
    const next = checked
      ? [...universitesChoisies, id]
      : universitesChoisies.filter((u) => u !== id);

    if (next.length === 0 || next.length > MAX_UNIVERSITES) return;

    setUniversitesChoisies(next);
    setColorById((prev) => assignColors(next, prev));

    // Si l'utilisateur clique vite, seule la dernière réponse doit être appliquée
    const requestId = ++repartitionRequestId.current;
    setRepartitionLoading(true);
    try {
      const data = await analyticsService.getRepartition(next);
      if (requestId === repartitionRequestId.current) setRepartition(data);
    } catch (e) {
      console.error("Erreur répartition par université", e);
    } finally {
      if (requestId === repartitionRequestId.current) setRepartitionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    );
  }

  const evolutionData = evolution.map((item) => ({
    name: String(item.annee),
    count: item.count,
  }));
  const pieData: PieDatum[] = repartition.map((item) => ({
    ...item,
    fill: colorById[item.id] ?? PIE_COLORS[0],
  }));
  const hasEvolutionData = chartOptions?.anneeMax != null;
  const hasFiltreConsultations = filtreMois !== undefined || filtreAnnee !== undefined;

  // Fenêtres de 5 ans, de la plus récente à la plus ancienne
  const periodes: { debut: number; label: string }[] = [];
  if (chartOptions?.anneeMax != null) {
    const fin = chartOptions.anneeMax;
    const min = chartOptions.anneeMin ?? fin;
    for (let debut = fin - (NB_ANNEES - 1); debut + (NB_ANNEES - 1) >= min; debut -= NB_ANNEES) {
      periodes.push({ debut, label: `${debut} – ${debut + NB_ANNEES - 1}` });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de l&apos;activité sur Valiha.
        </p>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiConfig.map(({ key, title, description, icon: Icon, format }) => {
          const isConsultations = key === "totalConsultations";
          const value =
            isConsultations && consultationsFiltrees !== null
              ? consultationsFiltrees
              : kpis?.[key];

          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-2xl font-bold">
                      {value == null ? "—" : format ? format(value) : value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isConsultations && consultationsFiltrees !== null
                        ? `Vues en ${filtreMois ? MOIS[filtreMois - 1] + " " : ""}${filtreAnnee ?? currentYear}`
                        : description}
                    </p>
                  </div>
                  {isConsultations && (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            className="relative h-7 w-7"
                            aria-label="Filtrer les consultations"
                          >
                            <ListFilter className="h-3.5 w-3.5" />
                            {hasFiltreConsultations && (
                              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                            )}
                          </Button>
                        }
                      />
                      <PopoverContent align="end" className="w-56 space-y-3 p-3">
                        <p className="text-sm font-medium">Filtrer par période</p>

                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Mois</label>
                          <Select
                            value={filtreMois ? String(filtreMois) : "all"}
                            onValueChange={(v) =>
                              setFiltreMois(v === "all" || v === null ? undefined : Number(v))
                            }
                          >
                            <SelectTrigger size="sm" className="w-full text-xs">
                              <SelectValue>
                                {filtreMois ? MOIS[filtreMois - 1] : "Tous"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous</SelectItem>
                              {MOIS.map((m, i) => (
                                <SelectItem key={m} value={String(i + 1)}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Année</label>
                          <Select
                            value={filtreAnnee ? String(filtreAnnee) : "all"}
                            onValueChange={(v) =>
                              setFiltreAnnee(v === "all" || v === null ? undefined : Number(v))
                            }
                          >
                            <SelectTrigger size="sm" className="w-full text-xs">
                              <SelectValue>{filtreAnnee ?? "Tous"}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous</SelectItem>
                              {ANNEES.map((a) => (
                                <SelectItem key={a} value={String(a)}>
                                  {a}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {hasFiltreConsultations && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-full text-xs"
                            onClick={() => {
                              setFiltreMois(undefined);
                              setFiltreAnnee(undefined);
                            }}
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Évolution par année (fenêtre de 5 ans) */}
        <Card className="col-span-4 border-muted">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Évolution des Dépôts par Année</CardTitle>
              <CardDescription>
                Nombre de mémoires validés par année de soutenance.
              </CardDescription>
            </div>
            {hasEvolutionData && anneeDebut !== null && (
              <Select value={String(anneeDebut)} onValueChange={handlePeriodeChange}>
                <SelectTrigger size="sm" className="h-7 w-auto gap-1 px-2 text-xs">
                  <SelectValue>
                    {`${anneeDebut} – ${anneeDebut + NB_ANNEES - 1}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {periodes.map((p) => (
                    <SelectItem key={p.debut} value={String(p.debut)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="pl-2">
            {!hasEvolutionData ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Aucune donnée disponible
              </div>
            ) : (
              <div
                className={`h-64 w-full mt-4 transition-opacity ${
                  evolutionLoading ? "opacity-50" : "opacity-100"
                }`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tickMargin={4}
                    />
                    <RechartsTooltip
                      content={<EvolutionTooltip />}
                      cursor={{
                        stroke: "var(--color-primary)",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                        opacity: 0.4,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Mémoires"
                      stroke="var(--color-primary)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: "var(--color-primary)",
                        fill: "var(--color-background, #fff)",
                      }}
                      activeDot={{
                        r: 7,
                        strokeWidth: 3,
                        stroke: "var(--color-primary)",
                        fill: "var(--color-background, #fff)",
                      }}
                      animationDuration={900}
                      animationEasing="ease-out"
                      style={{
                        filter:
                          "drop-shadow(0 6px 8px color-mix(in srgb, var(--color-primary) 35%, transparent))",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — Répartition par université (5 max) */}
        <Card className="col-span-3 border-muted sm:col-span-4 md:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Répartition par Université</CardTitle>
              <CardDescription>
                Distribution des mémoires validés par université.
              </CardDescription>
            </div>
            {chartOptions && chartOptions.universites.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                      Universités ({universitesChoisies.length}/{MAX_UNIVERSITES})
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="max-h-72 w-60 overflow-y-auto">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      {MAX_UNIVERSITES} universités maximum
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {chartOptions.universites.map((u) => {
                    const checked = universitesChoisies.includes(u.id);
                    const disabled = checked
                      ? universitesChoisies.length === 1
                      : universitesChoisies.length >= MAX_UNIVERSITES;

                    return (
                      <DropdownMenuCheckboxItem
                        key={u.id}
                        checked={checked}
                        disabled={disabled}
                        closeOnClick={false}
                        onCheckedChange={(c) => handleToggleUniversite(u.id, c)}
                      >
                        <span className="flex-1 truncate">{u.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{u.total}</span>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent>
            {repartition.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Aucune donnée disponible
              </div>
            ) : (
              <div
                className={`mt-4 transition-opacity ${
                  repartitionLoading ? "opacity-50" : "opacity-100"
                }`}
              >
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        shape={MyCustomPie}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #eee",
                          backgroundColor: "var(--color-background, #fff)",
                          color: "var(--color-foreground, #111)",
                        }}
                        itemStyle={{ color: "var(--color-foreground, #111)" }}
                        labelStyle={{ color: "var(--color-foreground, #111)" }}
                        formatter={(value: any, name: any) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Légende : même source (pieData) et même ordre que le camembert */}
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2">
                  {pieData.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top mémoires — BarChart */}
        <Card className="sm:col-span-4 col-span-3 border-muted">
          <CardHeader>
            <CardTitle>Mémoires les plus consultés</CardTitle>
            <CardDescription>
              Top des mémoires par nombre de consultations, coloré par domaine.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            {error ? (
              <div className="flex h-[400px] items-center justify-center text-sm text-destructive border border-dashed border-destructive/50 rounded-lg bg-destructive/10">
                {error}
              </div>
            ) : topMemoires.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="mt-4 h-[260px] w-full">
                <TopMemoiresBarChart data={topMemoires} limit={10} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}