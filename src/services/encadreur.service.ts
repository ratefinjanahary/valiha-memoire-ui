import { api } from '@/lib/api';
import type {
  CreateEncadreurPayload,
  Encadreur,
  EncadreurSearchResponse,
} from '@/types/memoire';

export const encadreurService = {
  // Liste paginée + recherche (alimente le ComboBox)
  search: async (params: { q?: string; page?: number; limit?: number } = {}) => {
    // Ne pas envoyer `q` si vide
    const cleanParams = { ...params };
    if (!cleanParams.q || cleanParams.q.trim() === '') {
      delete cleanParams.q;
    }
    const { data } = await api.get<EncadreurSearchResponse>('/encadreurs', { params: cleanParams });
    return data;
  },

  create: async (payload: CreateEncadreurPayload) => {
    const { data } = await api.post<Encadreur>('/encadreurs', payload);
    return data;
  },
};
