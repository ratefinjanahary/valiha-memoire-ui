export interface Universite {
  id: string;
  nom: string;
  sigle: string;
  ville?: string;
}

export interface Domaine {
  id: string;
  nom: string;
  description?: string;
}

export interface MotCle {
  id: string;
  libelle: string;
}

export interface Encadreur {
  id: string;
  nom: string;
  prenom: string;
  titre?: string;
  email?: string;
}

export interface Memoire {
  id: string;
  titre: string;
  resume: string;
  anneeSoutenance: number;
  typeDiplome: "LICENCE" | "MASTER" | "DOCTORAT";
  auteurNom: string;
  auteurPrenom: string;
  statut: "BROUILLON" | "EN_ATTENTE_MODERATION" | "VALIDE" | "REJETTE";
  pdfUrl?: string;
  universite?: Universite;
  domaine?: Domaine;
  motsCles?: { motCle: MotCle }[];
  encadreurs?: { encadreur: Encadreur; role?: string }[];
  nbConsultations?: number;
  jaccardScore?: number; // Pour les recommandations
}

export interface MemoireSearchResponse {
  data: Memoire[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TopMemoire {
  rang: number;
  id: string;
  titre: string;
  auteurNom: string;
  auteurPrenom: string;
  anneeSoutenance: number;
  typeDiplome: "LICENCE" | "MASTER" | "DOCTORAT";
  universite: {
    nom: string;
    sigle: string;
  };
  domaine: {
    nom: string;
  };
  nbConsultations: number;
}
