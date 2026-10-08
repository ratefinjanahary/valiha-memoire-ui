"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { XCircle, LucideIcon, BookCheck, BookAlert, BookSearch } from "lucide-react";

import { analyticsService } from "@/services/analytics.service";
import { memoireService } from "@/services/memoire.service";
import { TopMemoire } from "@/types/memoire";
import { TopMemoiresTreemap } from "@/components/dashboard/top-memoires-treemap";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface Kpis {
  totalMemoires: number;
  enAttente: number;
  rejetes: number;
  totalConsultations: number;
}

interface ChartItem {
  label: string;
  value: number;
}

interface AnneeItem {
  annee: number | string;
  count: number;
}

interface ChartsData {
  repartitionUniversite: ChartItem[];
  evolutionAnnee: AnneeItem[];
}

const pieColors = [
  "var(--color-primary)",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

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
    icon: BookCheck,
  },
  {
    key: "enAttente",
    title: "En attente de modération",
    description: "Soumissions en cours d'examen",
    icon: BookAlert,
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
    icon: BookSearch,
    format: (v) => v.toLocaleString(),
  },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [topMemoires, setTopMemoires] = useState<TopMemoire[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [kpiData, chartData, topData] = await Promise.all([
          analyticsService.getKpis(),
          analyticsService.getChartsData(),
          memoireService.getTop(50),
        ]);
        setKpis(kpiData);
        setCharts(chartData);
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

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    );
  }

  const evolutionData =
    charts?.evolutionAnnee.map((item) => ({
      name: String(item.annee),
      count: item.count,
    })) ?? [];

  const repartitionData = charts?.repartitionUniversite ?? [];

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
          const value = kpis?.[key];

          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {value == null ? "—" : format ? format(value) : value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Bar Chart — Évolution par année */}
        <Card className="col-span-4 border-muted">
          <CardHeader>
            <CardTitle>Évolution des Dépôts par Année</CardTitle>
            <CardDescription>
              Nombre de mémoires validés par année de soutenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {evolutionData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolutionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #eee",
                      }}
                      formatter={(value: any) => [value, "Mémoires"]}
                    />
                    <Bar
                      dataKey="count"
                      name="Mémoires"
                      fill="var(--color-primary)"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — Répartition par université */}
        <Card className="col-span-3 border-muted sm:col-span-4 md:col-span-3">
          <CardHeader>
            <CardTitle>Répartition par Université</CardTitle>
            <CardDescription>
              Distribution des mémoires validés par université.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {repartitionData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={repartitionData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {repartitionData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs">{value}</span>
                      )}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #eee",
                      }}
                      formatter={(value: any, name: any) => [
                        value,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treemap — Popularité par domaine */}
        <Card className="col-span-4 border-muted">
          <CardHeader>
            <CardTitle>Popularité par Domaine</CardTitle>
            <CardDescription>
              Regroupement des mémoires les plus consultés par domaine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex h-[400px] items-center justify-center text-sm text-destructive border border-dashed border-destructive/50 rounded-lg bg-destructive/10">
                {error}
              </div>
            ) : topMemoires.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="h-[400px] w-full mt-4">
                <TopMemoiresTreemap data={topMemoires} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
