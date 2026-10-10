"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphNodeType } from "@/types/graph";
import {
  NODE_COLORS,
  NODE_TYPES,
  NODE_TYPE_LABELS,
  NODE_TYPE_SINGULAR,
} from "./graph-config";

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

interface GraphToolbarProps {
  nodes: GraphNode[];
  counts: Record<GraphNodeType, number>;
  visibleTypes: Set<GraphNodeType>;
  onToggleType: (type: GraphNodeType) => void;
  onPick: (id: string) => void;
}

export function GraphToolbar({
  nodes,
  counts,
  visibleTypes,
  onToggleType,
  onPick,
}: GraphToolbarProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return nodes.filter((n) => normalize(n.label).includes(q)).slice(0, 8);
  }, [query, nodes]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {NODE_TYPES.map((type) => {
          const active = visibleTypes.has(type);
          return (
            <Button
              key={type}
              size="sm"
              variant={active ? "secondary" : "outline"}
              aria-pressed={active}
              onClick={() => onToggleType(type)}
              className={cn(!active && "text-muted-foreground")}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: NODE_COLORS[type],
                  opacity: active ? 1 : 0.35,
                }}
              />
              {NODE_TYPE_LABELS[type]} ({counts[type]})
            </Button>
          );
        })}
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un mémoire, un encadreur..."
          className="pl-8"
        />
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            {results.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(n.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: NODE_COLORS[n.type] }}
                  />
                  <span className="truncate">{n.label}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {NODE_TYPE_SINGULAR[n.type]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
