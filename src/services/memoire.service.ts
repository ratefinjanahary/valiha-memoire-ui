import { api } from '@/lib/api';
import { Memoire, MemoireSearchResponse, Universite, Domaine } from '@/types/memoire';

export const memoireService = {
  // Recherche classique & filtres
  search: async (params: { q?: string; mode?: 'any' | 'all'; annee?: number; typeDiplome?: string; universiteId?: string; domaineId?: string; page?: number }) => {
    // Ne pas envoyer `q` si vide — le DTO backend requiert min(1) quand présent
    const cleanParams = { ...params };
    if (!cleanParams.q || cleanParams.q.trim() === '') {
      delete cleanParams.q;
    }
    const { data } = await api.get<MemoireSearchResponse>('/memoires/search', { params: cleanParams });
    return data;
  },

  // Récupérer un mémoire spécifique
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

  // Top Consultés
  getTop: async (limit: number = 10) => {
    const { data } = await api.get<Memoire[]>(`/memoires/top`, { params: { limit } });
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
