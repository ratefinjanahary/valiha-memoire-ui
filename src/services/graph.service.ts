import { api } from '@/lib/api';
import type { GraphData } from '@/types/graph';

export const graphService = {
  getData: async () => {
    const { data } = await api.get<GraphData>('/graph/data');
    return data;
  },
};
