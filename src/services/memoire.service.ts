import { apiClient } from '@/lib/api-client';
import { Memoire, MemoireSearchResponse, Universite, Domaine } from '@/types/memoire';

export const memoireService = {
  // Recherche classique & filtres
  search: async (params: { q?: string; mode?: 'any' | 'all'; annee?: number; typeDiplome?: string; universiteId?: string; domaineId?: string; page?: number }) => {
    const { data } = await apiClient.get<MemoireSearchResponse>('/memoires/search', { params });
    return data;
  },

  // Récupérer un mémoire spécifique
  getById: async (id: string) => {
    const { data } = await apiClient.get<Memoire>(`/memoires/${id}`);
    return data;
  },

  // Soumettre un mémoire (Protégé - FormData pour l'upload PDF)
  submit: async (formData: FormData) => {
    const { data } = await apiClient.post('/memoires/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Mémoires similaires (Jaccard)
  getSimilaires: async (id: string, limit: number = 5) => {
    const { data } = await apiClient.get<Memoire[]>(`/memoires/${id}/similaires`, { params: { limit } });
    return data;
  },

  // Top Consultés
  getTop: async (limit: number = 10) => {
    const { data } = await apiClient.get<Memoire[]>(`/memoires/top`, { params: { limit } });
    return data;
  },
  
  // Lookups pour les filtres
  getUniversites: async () => {
    const { data } = await apiClient.get<Universite[]>('/universites');
    return data;
  },
  
  getDomaines: async () => {
    const { data } = await apiClient.get<Domaine[]>('/domaine');
    return data;
  }
};
