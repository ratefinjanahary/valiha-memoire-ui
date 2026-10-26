import { api } from '@/lib/api';

export interface KPI {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AuditLogUser {
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  createdAt: string;
  details?: string | null;
  user?: AuditLogUser | null;
}

export interface AuditMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChartItem {
  id: string;
  label: string;
  value: number;
}

export interface AnneeItem {
  annee: number;
  count: number;
}

export interface UniversiteOption {
  id: string;
  label: string;
  total: number;
}

export interface ChartsOptions {
  universites: UniversiteOption[];
  anneeMin: number | null;
  anneeMax: number | null;
}

export interface EvolutionResponse {
  anneeDebut: number;
  anneeFin: number;
  data: AnneeItem[];
}

export interface ChartsData {
  repartitionUniversite: ChartItem[];
  evolutionAnnee: AnneeItem[];
  periode: { anneeDebut: number; anneeFin: number };
  options: ChartsOptions;
}

export const analyticsService = {
  getKpis: async () => {
    const { data } = await api.get('/analytics/kpis');
    return data;
  },

  getConsultationsStats: async (params?: { annee?: number; mois?: number }) => {
    const { data } = await api.get<{
      annee: number | null;
      mois: number | null;
      totalConsultations: number;
    }>('/analytics/consultations', { params });
    return data;
  },

  getChartsData: async () => {
    const { data } = await api.get<ChartsData>('/analytics/charts');
    return data;
  },

  getEvolution: async (anneeDebut: number) => {
    const { data } = await api.get<EvolutionResponse>('/analytics/charts/evolution', {
      params: { anneeDebut },
    });
    return data;
  },

  getRepartition: async (universiteIds: string[]) => {
    const { data } = await api.get<ChartItem[]>('/analytics/charts/repartition', {
      params: { universiteIds: universiteIds.join(',') },
    });
    return data;
  },

  getAuditLogs: async (page: number = 1) => {
    const { data } = await api.get<{ data: AuditLog[]; meta: AuditMeta }>('/audit', { params: { page } });
    return data;
  },

  deleteAuditLog: async (id: string) => {
    const { data } = await api.delete<{ deleted: number }>(`/audit/${id}`);
    return data;
  },

  deleteAuditLogs: async (ids: string[]) => {
    const { data } = await api.post<{ deleted: number }>('/audit/bulk-delete', { ids });
    return data;
  },
};