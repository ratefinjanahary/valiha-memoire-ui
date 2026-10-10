"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { graphService } from "@/services/graph.service";
import type { GraphData, GraphNodeType } from "@/types/graph";
import { Spinner } from "@/components/ui/spinner";
import { MemoireDetailModal } from "@/components/memoires/memoire-detail-modal";
import { NODE_TYPES } from "@/components/graph/graph-config";
import { GraphToolbar } from "@/components/graph/graph-toolbar";
import {
  GraphNodePanel,
  type NodeLink,
} from "@/components/graph/graph-node-panel";

// react-force-graph touche à window/canvas : pas de SSR
const GraphCanvas = dynamic(
  () =>
    import("@/components/graph/graph-canvas").then((m) => m.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    ),
  },
);

function GraphExplorer() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<GraphNodeType>>(
    () => new Set(NODE_TYPES),
  );
  // ?focus=mem_<id> permet d'arriver directement sur un nœud (ex: depuis la fiche d'un mémoire)
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("focus"),
  );
  const [detailId, setDetailId] = useState<string | null>(null);

  // MemoireDetailModal a onClose dans les deps de son useEffect : il doit rester stable
  const handleCloseDetail = useCallback(() => setDetailId(null), []);

  // "Voir dans le graphe" depuis le modal alors qu'on est déjà sur /graph : même page,
  // seul ?focus change → on resynchronise la sélection
  const focusParam = searchParams.get("focus");
  useEffect(() => {
    if (focusParam) setSelectedId(focusParam);
  }, [focusParam]);

  useEffect(() => {
    graphService
      .getData()
      .then(setData)
      .catch((err) => {
        console.error("Erreur chargement du graphe", err);
        setError("Impossible de charger le graphe. Réessaie dans un instant.");
      });
  }, []);

  const nodeById = useMemo(
    () => new Map((data?.nodes ?? []).map((n) => [n.id, n])),
    [data],
  );

  const counts = useMemo(() => {
    const c: Record<GraphNodeType, number> = {
      memoire: 0,
      encadreur: 0,
      domaine: 0,
      universite: 0,
    };
    data?.nodes.forEach((n) => {
      c[n.type]++;
    });
    return c;
  }, [data]);

  const selectedNode = selectedId ? nodeById.get(selectedId) : undefined;

  const selectedLinks = useMemo<NodeLink[]>(() => {
    if (!data || !selectedId) return [];
    return data.edges.flatMap((e) => {
      const otherId =
        e.source === selectedId
          ? e.target
          : e.target === selectedId
            ? e.source
            : null;
      const other = otherId ? nodeById.get(otherId) : undefined;
      return other ? [{ node: other, edgeType: e.type }] : [];
    });
  }, [data, selectedId, nodeById]);

  const toggleType = (type: GraphNodeType) =>
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  // Sélectionner un nœud d'un type masqué (recherche, panneau) le ré-affiche
  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    const node = id ? nodeById.get(id) : undefined;
    if (node && !visibleTypes.has(node.type)) {
      setVisibleTypes((prev) => new Set(prev).add(node.type));
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Graphe académique</h1>
        <p className="text-muted-foreground">
          Explore les liens entre mémoires, encadreurs, domaines et universités.
        </p>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      ) : !data ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-5 w-5 text-primary" />
        </div>
      ) : data.nodes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
          Aucun mémoire validé pour le moment.
        </div>
      ) : (
        <>
          <GraphToolbar
            nodes={data.nodes}
            counts={counts}
            visibleTypes={visibleTypes}
            onToggleType={toggleType}
            onPick={handleSelect}
          />

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
            <GraphCanvas
              data={data}
              visibleTypes={visibleTypes}
              selectedId={selectedId}
              onSelect={handleSelect}
            />

            {selectedNode && (
              <div className="absolute inset-y-3 right-3 w-80 max-w-[calc(100%-1.5rem)]">
                <GraphNodePanel
                  node={selectedNode}
                  links={selectedLinks}
                  onSelect={handleSelect}
                  onClose={() => setSelectedId(null)}
                  onOpenMemoire={setDetailId}
                />
              </div>
            )}
          </div>
        </>
      )}

      <MemoireDetailModal
        memoireId={detailId}
        isOpen={detailId !== null}
        onClose={handleCloseDetail}
        onSelectSimilar={setDetailId}
      />
    </div>
  );
}

// useSearchParams impose un Suspense en build Next.js
export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Spinner className="h-5 w-5 text-primary" />
        </div>
      }
    >
      <GraphExplorer />
    </Suspense>
  );
}
