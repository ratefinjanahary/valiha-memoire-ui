import { api } from '@/lib/api';
import { Memoire } from '@/types/memoire';

export interface TrendingKeyword {
  motCleId: string;
  libelle: string;
  count: number;
}

export const searchService = {
  // Recherche Sémantique Vectorielle
  searchSemantic: async (query: string) => {
    const { data } = await api.post<Memoire[]>('/memoires/search-semantic', { query });
    // Si l'API renvoie { data: [...] }, on s'adapte, mais en général c'est directement un tableau
    return Array.isArray(data) ? data : (data as any).data || [];
  },

  // Mots-clés tendances (cache 5 min côté backend)
  getTrendingKeywords: async (limit: number = 10) => {
    const { data } = await api.get<TrendingKeyword[]>('/mot-cles/trending', { params: { limit } });
    return data;
  }
};
