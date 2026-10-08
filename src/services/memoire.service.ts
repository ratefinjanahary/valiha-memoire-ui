import { api } from '@/lib/api';
import { Memoire, MemoireSearchResponse, Universite, Domaine, TopMemoire } from '@/types/memoire';

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

  getById: async (id: string) => {
    const { data } = await api.get<Memoire>(`/memoires/${id}`);
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

  // Mémoires similaires (Jaccard)
  getSimilaires: async (id: string, limit: number = 5) => {
    const { data } = await api.get<Memoire[]>(`/memoires/${id}/similaires`, { params: { limit } });
    return data;
  },

  getTop: async (limit: number = 50) => {
    const { data } = await api.get<TopMemoire[]>(`/memoires/top`, { params: { limit } });
    return data;
  },

  // Récupérer les mémoires en attente de modération (pour les modérateurs)
  getPending: async (page: number = 1) => {
    const { data } = await api.get<{ data: Memoire[]; meta: any }>('/moderation/pending', { params: { page } });
    return data;
  },

  // Mettre à jour le statut d'un mémoire (valider ou rejeter)
  updateStatus: async (id: string, statut: 'VALIDE' | 'REJETTE', motifRejet?: string) => {
    const { data } = await api.patch(`/moderation/${id}/status`, { statut, motifRejet });
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
