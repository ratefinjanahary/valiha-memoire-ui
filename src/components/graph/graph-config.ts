import type { GraphEdgeType, GraphNodeType } from "@/types/graph";

// ⚠️ Ce fichier ne doit PAS importer react-force-graph (SSR) :
// la toolbar et le panneau l'utilisent, pas seulement le canvas.

export const NODE_TYPES: GraphNodeType[] = [
  "memoire",
  "encadreur",
  "domaine",
  "universite",
];

export const NODE_COLORS: Record<GraphNodeType, string> = {
  memoire: "#6366f1",
  encadreur: "#8b5cf6",
  domaine: "#10b981",
  universite: "#f59e0b",
};

export const NODE_TYPE_LABELS: Record<GraphNodeType, string> = {
  memoire: "Mémoires",
  encadreur: "Encadreurs",
  domaine: "Domaines",
  universite: "Universités",
};

export const NODE_TYPE_SINGULAR: Record<GraphNodeType, string> = {
  memoire: "Mémoire",
  encadreur: "Encadreur",
  domaine: "Domaine",
  universite: "Université",
};

// Libellé du groupe de voisins, selon le type du nœud sélectionné et la relation
const RELATION_LABELS: Record<string, string> = {
  "memoire:appartient_a": "Université",
  "memoire:traite_de": "Domaine",
  "memoire:encadre_par": "Encadreurs",
  "memoire:auteur_de": "Rédigé par",
  "encadreur:encadre_par": "Mémoires encadrés",
  "encadreur:auteur_de": "Mémoires rédigés",
  "domaine:traite_de": "Mémoires",
  "universite:appartient_a": "Mémoires",
};

export const relationLabel = (type: GraphNodeType, edge: GraphEdgeType) =>
  RELATION_LABELS[`${type}:${edge}`] ?? "Liés";

// TODO: adapte à ta route de détail d'un mémoire
export const memoireHref = (refId: string | number) => `/memoires/${refId}`;
