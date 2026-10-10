"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import type {
  GraphData,
  GraphEdge,
  GraphNode,
  GraphNodeType,
} from "@/types/graph";
import { NODE_COLORS, NODE_TYPE_SINGULAR } from "./graph-config";

type FGNode = NodeObject<GraphNode>;
type FGLink = LinkObject<GraphNode, GraphEdge>;

const BASE_RADIUS: Record<GraphNodeType, number> = {
  universite: 7,
  domaine: 6,
  encadreur: 5,
  memoire: 3,
};

/** Après le premier tick, d3 remplace source/target (string) par l'objet nœud. */
const endId = (end: unknown): string =>
  typeof end === "object" && end !== null
    ? String((end as { id: string | number }).id)
    : String(end);

/** Le tooltip de la lib est rendu en HTML : on échappe les titres venant de la BD. */
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface GraphCanvasProps {
  data: GraphData;
  visibleTypes: Set<GraphNodeType>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function GraphCanvas({
  data,
  visibleTypes,
  selectedId,
  onSelect,
}: GraphCanvasProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphEdge> | undefined>(
    undefined,
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const didFit = useRef(false);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  // --- Taille du conteneur (la lib prend la fenêtre entière par défaut) ---
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Copies mutables : la lib écrit x/y/vx/vy dans les objets ---
  const master = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })) as FGNode[],
      links: data.edges.map((e) => ({ ...e })) as FGLink[],
    }),
    [data],
  );

  // Voisinage (par ids) pour le highlight
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      const set = map.get(a);
      if (set) set.add(b);
      else map.set(a, new Set([b]));
    };
    for (const e of data.edges) {
      add(e.source, e.target);
      add(e.target, e.source);
    }
    return map;
  }, [data]);

  // Les mêmes objets nœuds sont réutilisés d'un filtre à l'autre → positions conservées
  const graphData = useMemo(() => {
    const nodes = master.nodes.filter((n) => visibleTypes.has(n.type));
    const ids = new Set(nodes.map((n) => String(n.id)));
    const links = master.links.filter(
      (l) => ids.has(endId(l.source)) && ids.has(endId(l.target)),
    );
    return { nodes, links };
  }, [master, visibleTypes]);

  const nodesRef = useRef<FGNode[]>(graphData.nodes);
  useEffect(() => {
    nodesRef.current = graphData.nodes;
  }, [graphData]);

  // --- Highlight : hover prioritaire sur la sélection ---
  const activeId = hoverId ?? selectedId;
  const activeNeighbors = activeId ? neighbors.get(activeId) : undefined;

  const isLit = useCallback(
    (id: string) => !activeId || id === activeId || !!activeNeighbors?.has(id),
    [activeId, activeNeighbors],
  );

  const radius = useCallback(
    (node: FGNode) => {
      const base = BASE_RADIUS[node.type];
      if (node.type === "memoire") return base;
      const degree = neighbors.get(String(node.id))?.size ?? 0;
      return base + Math.min(Math.sqrt(degree) * 1.1, 10);
    },
    [neighbors],
  );

  const labelColor = dark ? "#e5e7eb" : "#1f2937";

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const id = String(node.id);
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = radius(node);
      const lit = isLit(id);

      ctx.globalAlpha = lit ? 1 : 0.12;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = NODE_COLORS[node.type];
      ctx.fill();

      if (id === selectedId) {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = labelColor;
        ctx.stroke();
      }

      // Étiquettes : hubs dès un zoom modéré, mémoires seulement de près ou ciblés
      const showLabel =
        lit &&
        (node.type === "memoire" ? scale > 2.2 || id === activeId : scale > 0.7);

      if (showLabel) {
        const text =
          node.type === "memoire" && node.label.length > 42
            ? `${node.label.slice(0, 41)}…`
            : node.label;
        ctx.font = `${node.type === "memoire" ? 400 : 600} ${11 / scale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = labelColor;
        ctx.fillText(text, x, y + r + 2 / scale);
      }

      ctx.globalAlpha = 1;
    },
    [radius, isLit, selectedId, activeId, labelColor],
  );

  const paintPointerArea = useCallback(
    (node: FGNode, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, radius(node) + 2, 0, 2 * Math.PI);
      ctx.fill();
    },
    [radius],
  );

  const touches = useCallback(
    (l: FGLink) =>
      !!activeId && (endId(l.source) === activeId || endId(l.target) === activeId),
    [activeId],
  );

  const linkColor = useCallback(
    (l: FGLink) => {
      if (!activeId) {
        return l.type === "auteur_de"
          ? "rgba(139,92,246,0.55)"
          : dark
            ? "rgba(255,255,255,0.14)"
            : "rgba(0,0,0,0.14)";
      }
      if (touches(l)) return "rgba(99,102,241,0.9)";
      return dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    },
    [activeId, dark, touches],
  );

  // --- Centrage sur un nœud (clic, recherche, ?focus=...) ---
  const centerOn = useCallback((id: string) => {
    const fg = fgRef.current;
    const node = nodesRef.current.find((n) => String(n.id) === id);
    if (!fg || !node || node.x == null || node.y == null) return false;
    fg.centerAt(node.x, node.y, 600);
    fg.zoom(Math.max(fg.zoom(), node.type === "memoire" ? 3 : 1.2), 600);
    return true;
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    // Pas encore de coordonnées (premier chargement) → on attend la fin du layout
    if (!centerOn(selectedId)) pendingFocus.current = selectedId;
  }, [selectedId, centerOn]);

  const handleEngineStop = useCallback(() => {
    if (pendingFocus.current && centerOn(pendingFocus.current)) {
      pendingFocus.current = null;
      didFit.current = true;
      return;
    }
    pendingFocus.current = null;
    if (!didFit.current) {
      fgRef.current?.zoomToFit(400, 60);
      didFit.current = true;
    }
  }, [centerOn]);

  // --- Réglage des forces (une fois le graphe monté) ---
  const ready = size.width > 0;
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-70);
    fg.d3Force("link")?.distance(35);
  }, [ready]);

  return (
    <div
      ref={wrapRef}
      className={cn("h-full w-full", hoverId && "cursor-pointer")}
    >
      {ready && (
        <ForceGraph2D<GraphNode, GraphEdge>
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={graphData}
          nodeId="id"
          nodeLabel={(n) =>
            `${escapeHtml(n.label)} <i>(${NODE_TYPE_SINGULAR[n.type].toLowerCase()})</i>`
          }
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointerArea}
          linkColor={linkColor}
          linkWidth={(l) => (touches(l) ? 1.8 : 0.6)}
          linkDirectionalArrowLength={(l) => (l.type === "auteur_de" ? 4 : 0)}
          linkDirectionalArrowRelPos={1}
          // Sans ça, le canvas se met en pause une fois le layout stabilisé et le
          // highlight (déclenché depuis le panneau/la recherche) ne se repeint pas
          autoPauseRedraw={false}
          warmupTicks={30}
          cooldownTime={4000}
          onNodeClick={(n) => onSelect(String(n.id))}
          onBackgroundClick={() => onSelect(null)}
          onNodeHover={(n) => setHoverId(n ? String(n.id) : null)}
          onEngineStop={handleEngineStop}
        />
      )}
    </div>
  );
}
