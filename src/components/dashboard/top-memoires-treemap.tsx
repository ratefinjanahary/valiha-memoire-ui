"use client";

import { useMemo } from "react";
import {
  Treemap,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { TopMemoire } from "@/types/memoire";

interface TopMemoiresTreemapProps {
  data: TopMemoire[];
}

/* Une couleur par domaine */
const COLORS = [
  "#4f46e5", // indigo
  "#10b981", // émeraude
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#f59e0b", // ambre
  "#ec4899", // rose
  "#14b8a6", // teal
];

type TreemapLeaf = {
  name: string;
  value: number;
  color: string;
  domaine: string;
  auteurNom: string;
  auteurPrenom: string;
  universiteSigle: string;
  annee: number;
};

interface TreemapContentProps {
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  color?: string;
}

/* Rendu d'un bloc = un mémoire */
const CustomizedContent = (props: TreemapContentProps) => {
  const { depth, x, y, width, height, name, value, color } = props;

  // depth 0 = racine invisible, on ne dessine que les feuilles
  if (
    depth !== 1 ||
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return null;
  }

  const showLabel = width > 90 && height > 60;

  return (
    <g className="transition-opacity hover:opacity-80">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        ry={12}
        style={{ fill: color, stroke: "var(--background)", strokeWidth: 3 }}
      />
      {showLabel && (
        <foreignObject
          x={x}
          y={y}
          width={width}
          height={height}
          className="pointer-events-none"
        >
          <div className="flex h-full flex-col justify-between p-3 text-white">
            <p className="line-clamp-3 text-xs font-medium leading-snug">{name}</p>
            <p className="text-xl font-bold leading-none">
              {value}
              <span className="ml-1 text-xs font-normal opacity-80">vues</span>
            </p>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: TreemapLeaf }[];
}

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

export function TopMemoiresTreemap({ data }: TopMemoiresTreemapProps) {
  const { leaves, legend } = useMemo(() => {
    const domaines = Array.from(new Set(data.map((d) => d.domaine.nom)));
    const colorOf = new Map(domaines.map((nom, i) => [nom, COLORS[i % COLORS.length]]));

    const leaves: TreemapLeaf[] = data.map((m) => ({
      name: m.titre,
      value: m.nbConsultations,
      color: colorOf.get(m.domaine.nom)!,
      domaine: m.domaine.nom,
      auteurNom: m.auteurNom,
      auteurPrenom: m.auteurPrenom,
      universiteSigle: m.universite.sigle,
      annee: m.anneeSoutenance,
    }));

    const legend = domaines.map((nom) => ({ nom, color: colorOf.get(nom)! }));

    return { leaves, legend };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={leaves}
            dataKey="value"
            aspectRatio={4 / 3}
            isAnimationActive={false}
            content={<CustomizedContent />}
          >
            <RechartsTooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Légende des domaines */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {legend.map((l) => (
          <span key={l.nom} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.nom}
          </span>
        ))}
      </div>
    </div>
  );
}