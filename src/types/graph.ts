// Contrat de GET /graph/data (voir graph.service.ts côté API)

export type GraphNodeType = "universite" | "domaine" | "encadreur" | "memoire";

export type GraphEdgeType =
  | "appartient_a" // mémoire → université
  | "traite_de" // mémoire → domaine
  | "encadre_par" // mémoire → encadreur
  | "auteur_de"; // encadreur → mémoire (son propre mémoire)

export interface GraphNode {
  id: string; // préfixé : univ_ / dom_ / enc_ / mem_
  label: string;
  type: GraphNodeType;
  data: {
    refId: string; // id réel en BD (pour la navigation)
    [key: string]: unknown;
  };
}

export interface GraphEdge {
  id: string; // unique, utilisable tel quel comme id d'arête React Flow
  source: string;
  target: string;
  type: GraphEdgeType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
