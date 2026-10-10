"use client";

import { useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GraphEdgeType, GraphNode } from "@/types/graph";
import {
  NODE_COLORS,
  NODE_TYPE_SINGULAR,
  memoireHref,
  relationLabel,
} from "./graph-config";

export interface NodeLink {
  node: GraphNode;
  edgeType: GraphEdgeType;
}

interface GraphNodePanelProps {
  node: GraphNode;
  links: NodeLink[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function GraphNodePanel({
  node,
  links,
  onSelect,
  onClose,
}: GraphNodePanelProps) {
  const groups = useMemo(() => {
    const map = new Map<string, GraphNode[]>();
    for (const { node: other, edgeType } of links) {
      const label = relationLabel(node.type, edgeType);
      const list = map.get(label);
      if (list) list.push(other);
      else map.set(label, [other]);
    }
    return [...map.entries()];
  }, [node.type, links]);

  const d = node.data;
  const subtitle =
    node.type === "memoire"
      ? [d.typeDiplome, d.anneeSoutenance].filter(Boolean).join(", ")
      : node.type === "universite"
        ? String(d.nom ?? "")
        : node.type === "encadreur"
          ? String(d.titre ?? "")
          : "";

  return (
    <Card className="flex h-full flex-col gap-3 py-4 shadow-lg">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[node.type] }}
            />
            {NODE_TYPE_SINGULAR[node.type]}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 h-7 w-7"
            onClick={onClose}
            aria-label="Fermer le panneau"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-base leading-snug">{node.label}</CardTitle>
        {node.type === "memoire" && d.auteur ? (
          <CardDescription>{String(d.auteur)}</CardDescription>
        ) : null}
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
        {node.type === "memoire" && (
          <Button asChild size="sm">
            <Link href={memoireHref(String(d.refId))}>Ouvrir le mémoire</Link>
          </Button>
        )}

        {groups.map(([label, nodes]) => (
          <section key={label} className="space-y-1.5">
            <h3 className="text-sm font-medium">
              {label} ({nodes.length})
            </h3>
            <ul className="max-h-64 space-y-0.5 overflow-y-auto">
              {nodes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(n.id)}
                    className="w-full rounded px-2 py-1 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="line-clamp-2">{n.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
