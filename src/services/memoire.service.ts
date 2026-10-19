import { api } from '@/lib/api';
import {
  Memoire,
  MemoireSearchResponse,
  Universite,
  Domaine,
  TopMemoire,
  StatutMemoire,
  UpdateMemoirePayload,
  PaginationMeta,
} from '@/types/memoire';

export const memoireService = {
  
  search: async (params: { q?: string; mode?: 'any' | 'all'; annee?: number; typeDiplome?: string; universiteId?: string; domaineId?: string; page?: number }) => {
    // Ne pas envoyer `q` si vide
    const cleanParams = { ...params };
    if (!cleanParams.q || cleanParams.q.trim() === '') {
      delete cleanParams.q;
    }
    const { data } = await api.get<MemoireSearchResponse>('/memoires/search', { params: cleanParams });
    return data;
  },

  // Soumettre un mémoire (Protégé - FormData pour l'upload PDF)
  submit: async (formData: FormData) => {
    const { data } = await api.post('/memoires/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Memoire>(`/memoires/${id}`);
    return data;
  },

  // Mémoires similaires (Jaccard)
  getSimilaires: async (id: string, limit: number = 5) => {
    const { data } = await api.get<Memoire[]>(`/memoires/${id}/similaires`, { params: { limit } });
    return data;
  },

  getTop: async (limit: number = 50) => {
    const { data } = await api.get<TopMemoire[]>(`/memoires/top`, { params: { limit } });
    return data;
  },

  

  // Mettre à jour le statut d'un mémoire (valider ou rejeter)
  updateStatus: async (id: string, statut: 'VALIDE' | 'REJETTE', motifRejet?: string) => {
    const { data } = await api.patch(`/moderation/${id}/status`, { statut, motifRejet });
    return data;
  },
  
  // Liste de modération : tous les statuts, ou un seul si `statut` est fourni
  getModerationList: async (params: { statut?: StatutMemoire; page?: number; limit?: number }) => {
    const { data } = await api.get<{ data: Memoire[]; meta: PaginationMeta }>('/moderation/memoires', { params });
    return data;
  },

  // Modifier un mémoire non validé (BROUILLON, EN_ATTENTE_MODERATION, REJETTE)
  update: async (id: string, payload: UpdateMemoirePayload) => {
    const { data } = await api.patch<Memoire>(`/moderation/memoires/${id}`, payload);
    return data;
  },

  // Supprimer un mémoire non validé (supprime aussi le PDF)
  remove: async (id: string) => {
    const { data } = await api.delete<{ id: string; deleted: boolean }>(`/moderation/memoires/${id}`);
    return data;
  },

  // Lookups pour les filtres
  getUniversites: async () => {
    const { data } = await api.get<Universite[]>('/universites');
    return data;
  },
  
  getDomaines: async () => {
    const { data } = await api.get<Domaine[]>('/domaine');
    return data;
  }
};