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

export const analyticsService = {
  getKpis: async () => {
    const { data } = await api.get('/analytics/kpis');
    return data;
  },

  getChartsData: async () => {
    const { data } = await api.get('/analytics/charts');
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