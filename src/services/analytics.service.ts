import { api } from '@/lib/api';

export interface KPI {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
  details?: string;
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
    const { data } = await api.get<{ data: AuditLog[], meta: any }>('/audit', { params: { page } });
    return data;
  }
};
