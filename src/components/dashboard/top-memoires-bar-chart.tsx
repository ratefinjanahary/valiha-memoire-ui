"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { TopMemoire } from "@/types/memoire";

interface TopMemoiresBarChartProps {
  data: TopMemoire[];
  /** Nombre de mémoires affichés (le endpoint en renvoie 50, trop pour un bar chart) */
  limit?: number;
}

type BarLeaf = {
  id: string;
  name: string;
  value: number;
  domaine: string;
  auteurNom: string;
  auteurPrenom: string;
  universiteSigle: string;
  annee: number;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: BarLeaf }[];
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-sm max-w-[300px]">
      <p className="font-bold text-primary mb-1 line-clamp-2">{d.name}</p>
      <div className="space-y-1 text-muted-foreground">
        <p>Domaine : <span className="font-medium text-foreground">{d.domaine}</span></p>
        <p>Auteur : <span className="font-medium text-foreground">{d.auteurPrenom} {d.auteurNom}</span></p>
        <p>Université : <span className="font-medium text-foreground">{d.universiteSigle}</span></p>
        <p>Année : <span className="font-medium text-foreground">{d.annee}</span></p>
        <p>Consultations : <span className="font-medium text-foreground">{d.value}</span></p>
      </div>
    </div>
  );
};

export function TopMemoiresBarChart({ data, limit = 10 }: TopMemoiresBarChartProps) {
  const leaves = useMemo<BarLeaf[]>(
    () =>
      shuffle(
        [...data]
          .sort((a, b) => b.nbConsultations - a.nbConsultations)
          .slice(0, limit)
      ).map((m) => ({
        id: m.id,
        name: m.titre,
        value: m.nbConsultations,
        domaine: m.domaine.nom,
        auteurNom: m.auteurNom,
        auteurPrenom: m.auteurPrenom,
        universiteSigle: m.universite.sigle,
        annee: m.anneeSoutenance,
      })),
    [data, limit]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={leaves}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          barCategoryGap="10%"
        >
          <XAxis dataKey="name" hide />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar
            dataKey="value"
            fill="var(--color-primary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={88}
            isAnimationActive
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}